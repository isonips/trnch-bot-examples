# trnch-bot-examples

Minimal Node.js examples for the TRNCH bot API.

TRNCH is the trading terminal for Robinhood Chain (chain ID 4663).

- **Heat**: every new pool on Robinhood Chain gets a live momentum score, with dead and fake pools filtered out.
- **Trade**: every swap is quoted across KyberSwap, LI.FI, Uniswap and 0x, and the best route wins. It is non-custodial: users sign in their own wallet.
- **Free open bot API**: a live Heat feed, a webhook when a token enters Heat, buy/sell at the best route in one call, and your keys stay with your bot.

## What the API does

Base URL: `https://trnch.fun/api/bot/v1`

Every call needs your API key in this header:

```
Authorization: Bearer trnch_bot_YOUR_KEY
```

| Method and path | What it does |
| --- | --- |
| `GET /heat[?since=<epoch ms or ISO date>]` | The live Heat race. With `since`, only tokens that entered Heat after it; pass the `nextSince` of each response to your next call. |
| `POST /quote` | Best route for a swap. Body: `tokenIn`, `tokenOut`, `amountIn` (smallest unit), optional `decimalsIn`, `decimalsOut`, `slippage` (a fraction, `0.01` is 1%). |
| `POST /buy` | One call to buy. Body: `token` plus `amountUsd` (paid in USDG) or `amountIn` (+ optional `tokenIn`); optional `slippageBps`. Returns `{ router, quote, approval, tx, chainId, from }`. |
| `POST /sell` | One call to sell for USDG. Body: `token` plus `percent` or `amount`; optional `slippageBps`. Same response as `/buy`. |
| `POST /build` | A transaction ready to sign for the quote body plus a `router` (from `/quote`). |
| `POST /confirm` | Tell us the hash of the transaction your bot sent: `{ "txHash": "0x..." }`. |

Heat webhook: give an https URL to a key in your profile (API section). When a token enters Heat we send a JSON `POST` with an `X-TRNCH-Signature: t=<unix seconds>,v1=<hex>` header, where `v1` is the HMAC-SHA256 of `<t>.<raw body>` with your `whsec_...` secret. Answer 2xx within 3 seconds. The URL must be https on port 443 with a public domain name (no IP address), so to receive webhooks locally you need a public https endpoint in front of the example (a reverse proxy or tunnel of your choice).

See https://trnch.fun/bot for the full reference and limits.

## Get started in 2 minutes

1. Connect your wallet on [trnch.fun](https://trnch.fun), open your profile and create a key in the API section. It is shown once: copy it then.
2. `cp .env.example .env` and set `TRNCH_BOT_KEY`.
3. Run an example (Node.js 18+, no dependencies; `--env-file` needs Node 20.6+):

```
node --env-file=.env examples/heat-feed.mjs
TOKEN_OUT=0xTOKEN_ADDRESS node --env-file=.env examples/best-route-quote.mjs
node --env-file=.env examples/heat-webhook.mjs
```

| Example | What it does |
| --- | --- |
| `examples/heat-feed.mjs` | Polls `/heat` with `since`/`nextSince` and prints tokens as they enter Heat. |
| `examples/heat-webhook.mjs` | Tiny `node:http` server that verifies `X-TRNCH-Signature` and prints `heat.entry` events. Needs `TRNCH_WEBHOOK_SECRET`. |
| `examples/best-route-quote.mjs` | Asks `/quote` for the best route and prints the answer. Does not sign or send anything. |

## Safety

- Never paste a private key into any example, and never commit your `.env`.
- These examples never need a private key: they only read data or ask for a quote.
- `/buy`, `/sell` and `/build` return an unsigned transaction. If you add that step, your bot signs locally with its own key, and that key stays in the bot's environment. TRNCH never holds your funds and never sees your keys.
- Use a dedicated wallet with a small balance. Nothing here is financial advice.

## Links

- Site: https://trnch.fun
- Bot API: https://trnch.fun/bot
- Docs: https://docs.trnch.fun
- X: [@trnchfun](https://x.com/trnchfun)
- Telegram: https://t.me/trnchfun
- Alerts: https://t.me/trnchalerts
- Telegram bot: @TrnchBot

MIT licensed.
