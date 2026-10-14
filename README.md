# Wallbit plugin (Cursor / Agent Plugins)
MCP stdio (Node >= 18, sin dependencias) + skill para la Wallbit Public API (https://developer.wallbit.io/docs).
Configuración: variable secreta `WALLBIT_API_KEY` (Plugins → Configure). Permiso `read` alcanza para consultas; `trade` para compras.
Compras en dos pasos: `wallbit_draft_buy_order` → confirmación del usuario → `wallbit_execute_buy_order(confirmation_token, confirm=true)`.
Test local: `node server/index.mjs` y JSON-RPC por stdin.