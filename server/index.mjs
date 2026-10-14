#!/usr/bin/env node
// Wallbit MCP server: zero deps, stdio JSON-RPC (newline-delimited), Node >= 18.
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE = process.env.WALLBIT_BASE_URL || "https://api.wallbit.io";
const UA = "wallbit-cursor-plugin/0.1.1 (+https://github.com/rodrigouroz)";
const DRAFT_TTL_MS = 10 * 60 * 1000;
const drafts = new Map(); // token -> { order, summary, expires }

function apiKey() {
  const envKey = process.env.WALLBIT_API_KEY;
  if (envKey && !envKey.startsWith("${")) return envKey;
  const keyFile = process.env.WALLBIT_API_KEY_FILE || join(homedir(), ".config", "wallbit", "key");
  try {
    return readFileSync(keyFile, "utf8").trim();
  } catch {
    throw new UserError("Falta la key de Wallbit. Guardala en ~/.config/wallbit/key (permiso read; trade solo para comprar).");
  }
}
class UserError extends Error {}

async function call(method, path, { query, body } = {}) {
  const key = apiKey();
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(query || {})) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    method,
    headers: { "X-API-Key": key, "User-Agent": UA, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = null; }
  if (!res.ok) {
    if (!data && /<html/i.test(text)) throw new UserError(`HTTP ${res.status}: respuesta HTML (probable bloqueo de Cloudflare).`);
    const msg = data?.message || text.slice(0, 300);
    const hint = { 401: " (key faltante o inválida)", 403: " (la key no tiene el permiso necesario: read/trade)", 429: " (rate limit; esperá antes de reintentar)" }[res.status] || "";
    throw new UserError(`Wallbit HTTP ${res.status}${hint}: ${msg}`);
  }
  return data ?? text;
}

const S = (props = {}, required = []) => ({ type: "object", properties: props, required, additionalProperties: false });
const tools = [
  { name: "wallbit_get_checking_balance", description: "Saldos de la cuenta checking (GET /api/public/v1/balance/checking). Solo monedas con saldo positivo.", inputSchema: S(),
    run: () => call("GET", "/api/public/v1/balance/checking") },
  { name: "wallbit_get_portfolio", description: "Posiciones de la cuenta de inversión y USD disponible para invertir (GET /api/public/v1/balance/stocks).", inputSchema: S(),
    run: () => call("GET", "/api/public/v1/balance/stocks") },
  { name: "wallbit_list_transactions", description: "Historial de transacciones con filtros (GET /api/public/v1/transactions). Incluye trades y su estado.",
    inputSchema: S({ page: { type: "integer", minimum: 1 }, limit: { type: "integer", minimum: 1 }, status: { type: "string", description: "p.ej. COMPLETED, PENDING, FAILED" }, type: { type: "string" }, currency: { type: "string" }, from_date: { type: "string", description: "YYYY-MM-DD" }, to_date: { type: "string", description: "YYYY-MM-DD" } }),
    run: (a) => call("GET", "/api/public/v1/transactions", { query: a }) },
  { name: "wallbit_get_asset", description: "Info y precio actual de un activo (GET /api/public/v1/assets/{symbol}). Usalo como cotización.",
    inputSchema: S({ symbol: { type: "string" } }, ["symbol"]),
    run: (a) => call("GET", `/api/public/v1/assets/${encodeURIComponent(String(a.symbol).toUpperCase())}`) },
  { name: "wallbit_search_assets", description: "Lista/busca activos operables (GET /api/public/v1/assets).",
    inputSchema: S({ search: { type: "string" }, category: { type: "string" }, page: { type: "integer", minimum: 1 }, limit: { type: "integer", minimum: 1 } }),
    run: (a) => call("GET", "/api/public/v1/assets", { query: a }) },
  { name: "wallbit_draft_buy_order", description: "PASO 1 de una compra. NO ejecuta nada: valida, consulta precio y devuelve un resumen y un confirmation_token (vence en 10 min). Mostrale el resumen al usuario y esperá su OK explícito.",
    inputSchema: S({ symbol: { type: "string" }, amount_usd: { type: "number", exclusiveMinimum: 0 }, order_type: { type: "string", enum: ["MARKET"], default: "MARKET" } }, ["symbol", "amount_usd"]),
    run: async (a) => {
      const symbol = String(a.symbol).toUpperCase().trim();
      const amount = Math.round(Number(a.amount_usd) * 100) / 100;
      if (!/^[A-Z.\-]{1,10}$/.test(symbol)) throw new UserError("Símbolo inválido.");
      if (!(amount > 0)) throw new UserError("amount_usd debe ser > 0.");
      const asset = await call("GET", `/api/public/v1/assets/${encodeURIComponent(symbol)}`);
      const price = asset?.data?.price;
      const order = { symbol, direction: "BUY", currency: "USD", order_type: "MARKET", amount };
      const token = randomUUID();
      const summary = `Comprar USD ${amount.toFixed(2)} de ${symbol} (${asset?.data?.name ?? "?"}) a mercado. Precio ref.: ${price ?? "desconocido"}${price ? ` (~${(amount / price).toFixed(4)} unidades, estimado)` : ""}. Sale del saldo de la cuenta de inversión.`;
      drafts.set(token, { order, summary, expires: Date.now() + DRAFT_TTL_MS });
      return { status: "DRAFT_NOT_EXECUTED", summary, order, confirmation_token: token, expires_in_seconds: DRAFT_TTL_MS / 1000, next: "Pedí confirmación explícita al usuario; recién entonces llamá wallbit_execute_buy_order con este token y confirm=true." };
    } },
  { name: "wallbit_execute_buy_order", description: "PASO 2. Ejecuta (POST /api/public/v1/trades) una compra previamente borrador. Requiere confirmation_token de wallbit_draft_buy_order y confirm=true, SOLO después de que el usuario confirmó explícitamente. Un solo intento; nunca reintentar automáticamente.",
    inputSchema: S({ confirmation_token: { type: "string" }, confirm: { type: "boolean" } }, ["confirmation_token", "confirm"]),
    run: async (a) => {
      if (a.confirm !== true) throw new UserError("confirm debe ser true, y solo tras la confirmación explícita del usuario.");
      const d = drafts.get(a.confirmation_token);
      if (!d) throw new UserError("Token desconocido o ya usado. Generá un nuevo borrador.");
      drafts.delete(a.confirmation_token); // single use: no auto-retry
      if (Date.now() > d.expires) throw new UserError("El borrador venció. Generá uno nuevo y volvé a confirmar.");
      try {
        const r = await call("POST", "/api/public/v1/trades", { body: d.order });
        const st = String(r?.data?.status ?? "").toUpperCase();
        return { submitted: d.order, response: r, note: (["REQUESTED", "PENDING", ""].includes(st) ? "La orden fue ENVIADA pero NO está ejecutada todavía. Verificá luego con wallbit_list_transactions." : `Estado informado: ${st}`) };
      } catch (e) {
        throw new UserError(`${e.message}. No se reintentó. Antes de volver a intentar, revisá wallbit_list_transactions para evitar una compra duplicada.`);
      }
    } },
];

const send = (m) => process.stdout.write(JSON.stringify(m) + "\n");
async function handle(msg) {
  const { id, method, params } = msg;
  if (id === undefined) return; // notification
  try {
    if (method === "initialize") return send({ jsonrpc: "2.0", id, result: { protocolVersion: params?.protocolVersion || "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "wallbit", version: "0.1.1" } } });
    if (method === "ping") return send({ jsonrpc: "2.0", id, result: {} });
    if (method === "tools/list") return send({ jsonrpc: "2.0", id, result: { tools: tools.map(({ run, ...t }) => t) } });
    if (method === "tools/call") {
      const t = tools.find((x) => x.name === params?.name);
      if (!t) return send({ jsonrpc: "2.0", id, error: { code: -32602, message: `Unknown tool: ${params?.name}` } });
      try {
        const out = await t.run(params.arguments || {});
        return send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] } });
      } catch (e) {
        return send({ jsonrpc: "2.0", id, result: { isError: true, content: [{ type: "text", text: e instanceof UserError ? e.message : `Error: ${e.message}` }] } });
      }
    }
    send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
  } catch (e) { send({ jsonrpc: "2.0", id, error: { code: -32603, message: e.message } }); }
}
createInterface({ input: process.stdin }).on("line", (l) => { if (!l.trim()) return; let m; try { m = JSON.parse(l); } catch { return send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }); } handle(m); });