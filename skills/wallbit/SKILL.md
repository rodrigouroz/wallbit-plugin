---
name: wallbit
description: Consultar y operar la cuenta de Wallbit (wallbit.io) del usuario. Usar para saldos, portfolio, transacciones, precios de activos y para preparar compras (DCA) que el usuario confirma a mano.
---

# Wallbit

## Qué tool usar
- Saldo en la cuenta checking (USD/EUR): `wallbit_get_checking_balance`.
- Posiciones y USD disponible para invertir: `wallbit_get_portfolio`.
- Historial / estado de órdenes: `wallbit_list_transactions` (filtros status, type, fechas).
- Precio o info de un ticker: `wallbit_get_asset`; buscar tickers: `wallbit_search_assets`.
- Comprar: `wallbit_draft_buy_order` y, solo tras confirmación, `wallbit_execute_buy_order`.

## Regla de confirmación (obligatoria)
1. Toda compra empieza con `wallbit_draft_buy_order`; no ejecuta nada.
2. Mostrá el resumen tal cual y pedí un "sí" explícito por esa orden puntual. Silencio, "ok en general" o una instrucción vieja no cuentan.
3. Recién ahí `wallbit_execute_buy_order` con el token y `confirm=true`. Un token por orden; nunca reintentes solo. Si falla, revisá transacciones y preguntá.
4. REQUESTED/PENDING significa enviada, no ejecutada. No digas "comprado" hasta verlo COMPLETED en transacciones.
5. Nunca vendas ni muevas fondos: este plugin no lo hace.

## Contexto DCA del usuario (semanal)
- USD 100 al fondo de emergencia: queda en cash, no se compra nada.
- USD 100 a invertir: 80% VT (USD 80) y 20% BND (USD 20), dos borradores separados, cada uno confirmado a mano.
- Antes de proponer, verificá con `wallbit_get_portfolio` que haya USD disponible en inversión. Si no alcanza, avisá; no inventes saldos, precios ni estados: siempre salen de las tools.