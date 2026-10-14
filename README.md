# Wallbit plugin (Cursor / Agent Plugins)
MCP stdio (Node >= 18, sin dependencias) + skill para la Wallbit Public API (https://developer.wallbit.io/docs).

## Setup
- **Cursor / Cloud Agents**: variable secreta `WALLBIT_API_KEY` (Plugins → Configure).
- **Local**: guardá tu key en `~/.config/wallbit/key`:
  ```bash
  mkdir -p ~/.config/wallbit && pbpaste > ~/.config/wallbit/key && chmod 600 ~/.config/wallbit/key
  ```
  Después reloadá Cursor (`Cmd+Shift+P` → "Reload Window").

Permiso `read` alcanza para consultas; `trade` para compras.

## Uso
Compras en dos pasos: `wallbit_draft_buy_order` → confirmación del usuario → `wallbit_execute_buy_order(confirmation_token, confirm=true)`.
Test local: `node server/index.mjs` y JSON-RPC por stdin.