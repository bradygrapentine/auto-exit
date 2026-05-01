# Phase 3 Preflight — verify before flipping `dryRun: false`

The fill-reconciliation rewrite (May 2026) makes assumptions about Kalshi
response shapes that have NOT been validated against the live API. Before any
real-money run, do all of the following. None require executing a sell.

## 1. Capture a real `POST /portfolio/orders` response

In a sandbox / demo account (or with a 1-share `count`), place a clearly
non-marketable buy order so it rests, capture the JSON, then cancel.

```bash
curl -X POST "$BASE/portfolio/orders" \
  -H "KALSHI-ACCESS-KEY: $KEY" \
  -H "KALSHI-ACCESS-TIMESTAMP: $TS" \
  -H "KALSHI-ACCESS-SIGNATURE: $SIG" \
  -H "Content-Type: application/json" \
  -d '{...rest-only buy at 1¢...}' | tee /tmp/kalshi-create.json
```

Confirm the keys `parseOrderResponse` reads actually exist:

- `order.order_id` (or `order.id`)
- `order.status` — confirm spelling (`resting`, `filled`, `canceled`, `partially_filled`)
- `order.count`
- `order.remaining_count` (or `order.remaining`)
- `order.filled_count` (optional — derived if absent)

If the wrapper key is not `order` (e.g. it's flat, or `data`, or `result`),
update `parseOrderResponse` in `src/kalshiClient.ts:51`.

## 2. Capture `GET /portfolio/orders/{id}` and `DELETE /portfolio/orders/{id}`

Re-poll the resting order, then cancel. Save both responses. Confirm the same
fields appear and that cancel echoes the final filled count.

## 3. Verify auth scheme

The current signer is `RSA-SHA256(timestamp + METHOD + path)`. Kalshi has shipped
multiple variants. Compare against the current Kalshi API doc and the official
SDK. Specifically:

- Is the signed message `timestamp+method+path` or `timestamp+method+path+body`?
- Header name capitalization — `KALSHI-ACCESS-*` vs lowercase.
- Timestamp unit — milliseconds (current) vs seconds.

A failing first call is fine — that's why we test on a 1-share rest order.

## 4. Auth + rate-limit sanity

- Make 5 reads in a loop. Confirm no 429s under normal use.
- Plan retry/backoff for 429 + 5xx (Phase 3 hardening track C).

## 5. Position-truth check

Hit `GET /portfolio/positions` (or whatever the endpoint is in your API
version) and confirm the script can detect "you no longer hold this side"
before sending another sell. This is what the "position refresh" Phase 3
roadmap item is about.

## 6. After this checklist passes

Update `parseOrderResponse` and `mapStatus` to match observed shapes, add a
fixture under `engine-ts/test/fixtures/` with a real captured response, and
add a regression test that pins the parser against the captured fixture.
THEN consider live mode with `count: 1`, `dryRun: false`, on a market you
are willing to lose a penny on.
