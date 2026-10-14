# Wallbit Plugin (Cursor / Agent Plugins)

**Built by Rodrigo Uroz. Unofficial: not affiliated with or endorsed by Wallbit.**  
**Creado por Rodrigo Uroz. No oficial: sin afiliación ni respaldo de Wallbit.**

---

## What it does / Qué hace

**English:** MCP stdio plugin (Node >= 18, zero dependencies) for the Wallbit Public API (https://developer.wallbit.io/docs). Query checking balances, investment portfolio, transactions, asset prices, and draft buy orders with mandatory two-step confirmation.

**Español:** Plugin MCP stdio (Node >= 18, sin dependencias) para la Wallbit Public API (https://developer.wallbit.io/docs). Consultar saldos checking, portfolio de inversión, transacciones, precios de activos, y preparar órdenes de compra con confirmación obligatoria en dos pasos.

---

## Tools / Herramientas

- `wallbit_get_checking_balance` – Checking account balances / Saldos cuenta checking
- `wallbit_get_portfolio` – Investment positions and available USD / Posiciones y USD disponible para invertir
- `wallbit_list_transactions` – Transaction history (filters: status, date, type) / Historial de transacciones
- `wallbit_get_asset` – Current price and asset info / Precio e info de un activo
- `wallbit_search_assets` – Search tradable assets / Buscar activos operables
- `wallbit_draft_buy_order` – Draft a buy order (STEP 1, does NOT execute) / Preparar orden de compra (PASO 1, NO ejecuta)
- `wallbit_execute_buy_order` – Execute a drafted order (STEP 2, requires confirmation) / Ejecutar orden preparada (PASO 2, requiere confirmación)

---

## Install / Instalación

**English:**
- **Cursor Marketplace** (once listed): Install from Cursor Marketplace (recommended).
- **Import repository as marketplace**: In Cursor, go to Plugins → Import Marketplace → paste `https://github.com/rodrigouroz/wallbit-plugin`.

**Español:**
- **Cursor Marketplace** (cuando esté listado): Instalar desde Cursor Marketplace (recomendado).
- **Importar repositorio como marketplace**: En Cursor, ir a Plugins → Import Marketplace → pegar `https://github.com/rodrigouroz/wallbit-plugin`.

---

## API Key Setup / Configuración de la API Key

**English:**
Get your API key from Wallbit (Settings → API Keys). Scopes: `read` for queries; `trade` only if you want to buy.

### Local development (macOS/Linux):
Save your key to `~/.config/wallbit/key`:

**macOS:**
```bash
mkdir -p ~/.config/wallbit && pbpaste > ~/.config/wallbit/key && chmod 600 ~/.config/wallbit/key
```

**Linux (with xclip):**
```bash
mkdir -p ~/.config/wallbit && xclip -o > ~/.config/wallbit/key && chmod 600 ~/.config/wallbit/key
```

Then reload Cursor (`Cmd+Shift+P` / `Ctrl+Shift+P` → "Reload Window").

### Cursor Plugin / Cloud Agents (if supported):
If your Cursor shows a `WALLBIT_API_KEY` plugin variable, you can set it there instead. Otherwise use the file method above.

**Español:**
Obtener la API key desde Wallbit (Settings → API Keys). Permisos: `read` para consultas; `trade` solo si querés comprar.

### Desarrollo local (macOS/Linux):
Guardar la key en `~/.config/wallbit/key`:

**macOS:**
```bash
mkdir -p ~/.config/wallbit && pbpaste > ~/.config/wallbit/key && chmod 600 ~/.config/wallbit/key
```

**Linux (con xclip):**
```bash
mkdir -p ~/.config/wallbit && xclip -o > ~/.config/wallbit/key && chmod 600 ~/.config/wallbit/key
```

Después recargar Cursor (`Cmd+Shift+P` / `Ctrl+Shift+P` → "Reload Window").

### Plugin Cursor / Cloud Agents (si es soportado):
Si Cursor muestra una variable de plugin `WALLBIT_API_KEY`, se puede configurar ahí. Sino, usar el método de archivo de arriba.

---

## Two-step buy safety / Seguridad de compra en dos pasos

**English:** All buy orders require two steps:
1. **Draft** (`wallbit_draft_buy_order`): validates, fetches price, returns summary + token (expires in 10 min).
2. **Execute** (`wallbit_execute_buy_order`): requires the token + `confirm=true`, ONLY after explicit user confirmation. Single-use token; never auto-retry.

**Español:** Todas las órdenes de compra requieren dos pasos:
1. **Borrador** (`wallbit_draft_buy_order`): valida, consulta precio, devuelve resumen + token (vence en 10 min).
2. **Ejecutar** (`wallbit_execute_buy_order`): requiere el token + `confirm=true`, SOLO tras confirmación explícita del usuario. Token de un solo uso; nunca reintenta automáticamente.

---

## Requirements / Requisitos

- Node.js >= 18
- Zero dependencies / Sin dependencias

---

## Documentation / Documentación

Wallbit API: https://developer.wallbit.io/docs

---

## Local testing / Prueba local

**English:**
```bash
node server/index.mjs
```
Then send JSON-RPC messages via stdin (newline-delimited).

**Español:**
```bash
node server/index.mjs
```
Luego enviar mensajes JSON-RPC por stdin (delimitados por salto de línea).

---

## Disclaimer / Aviso legal

**English:** This plugin is provided "as is" without warranty. Not financial advice. Use at your own risk. Always verify transactions and account details. The author is not responsible for losses or errors.

**Español:** Este plugin se provee "tal cual" sin garantías. No es asesoría financiera. Usar bajo propio riesgo. Siempre verificar transacciones y detalles de cuenta. El autor no es responsable por pérdidas o errores.

---

## License / Licencia

MIT – See [LICENSE](LICENSE)