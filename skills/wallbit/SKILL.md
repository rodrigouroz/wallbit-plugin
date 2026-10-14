---
name: wallbit
description: Operate the user's Wallbit (wallbit.io) account. Query balances, portfolio, transactions, asset prices, and execute two-step buy orders.
---

# Wallbit

## Tools

### Account balances
- **`wallbit_get_checking_balance`** – Checking account balances (GET /api/public/v1/balance/checking). Returns only currencies with positive balance.
- **`wallbit_get_portfolio`** – Investment account positions and available USD to invest (GET /api/public/v1/balance/stocks).

### Transactions
- **`wallbit_list_transactions`** – Transaction history with filters (GET /api/public/v1/transactions). Includes trades and their status.
  - Filters: `page`, `limit`, `status` (e.g. COMPLETED, PENDING, FAILED), `type`, `currency`, `from_date`, `to_date` (YYYY-MM-DD).
  - Transaction statuses: REQUESTED/PENDING mean submitted but not executed; only COMPLETED is executed.

### Assets
- **`wallbit_get_asset`** – Current price and info for one asset by symbol (GET /api/public/v1/assets/{symbol}). Use for quotes.
- **`wallbit_search_assets`** – List/search tradable assets (GET /api/public/v1/assets). Filters: `search`, `category`, `page`, `limit`.

## Two-step buy orders

Buy orders use a mandatory two-step flow:

1. **`wallbit_draft_buy_order`** – Draft a buy order. Does NOT execute anything. Validates parameters, fetches the current price, and returns a summary plus a `confirmation_token` (expires in 10 minutes).
   - Parameters: `symbol` (string), `amount_usd` (number > 0), `order_type` (default "MARKET").
   - Returns: summary, order details, `confirmation_token`, expiration.
   - Note: `amount_usd` is the USD amount to spend, not the number of shares/units.

2. **`wallbit_execute_buy_order`** – Execute a previously drafted order (POST /api/public/v1/trades). Requires the `confirmation_token` from step 1 and `confirm=true`. Execution requires an explicit user confirmation obtained by the host agent.
   - Parameters: `confirmation_token` (string), `confirm` (boolean, must be true).
   - Single-use token: one attempt per draft. Never auto-retry. If it fails, check `wallbit_list_transactions` before drafting again to avoid duplicates.
   - Submitted orders may return status REQUESTED or PENDING; verify execution later with `wallbit_list_transactions` (COMPLETED = executed).

## Data notes
- **Checking account**: cash balances (USD, EUR, etc.).
- **Investment account**: stock/ETF positions and available USD balance for investing (from `wallbit_get_portfolio`).