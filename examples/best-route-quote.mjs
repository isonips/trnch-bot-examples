// Ask for the best route for a swap and print the answer. Nothing is signed or sent.
// Run: TOKEN_OUT=0x... node --env-file=.env examples/best-route-quote.mjs
const API = "https://trnch.fun/api/bot/v1";
const key = process.env.TRNCH_BOT_KEY;
const tokenOut = process.env.TOKEN_OUT;
if (!key || !tokenOut) {
  console.error("Set TRNCH_BOT_KEY and TOKEN_OUT (address of the token to buy) in .env.");
  process.exit(1);
}

// Default input: USDG (6 decimals), 25 USDG. amountIn is in the smallest unit of tokenIn.
const body = {
  tokenIn: process.env.TOKEN_IN ?? "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  tokenOut,
  amountIn: process.env.AMOUNT_IN ?? "25000000",
  decimalsIn: Number(process.env.DECIMALS_IN ?? 6),
  decimalsOut: Number(process.env.DECIMALS_OUT ?? 18),
  slippage: 0.01, // a fraction: 0.01 is 1%
};

const res = await fetch(API + "/quote", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const json = await res.json().catch(() => null);
if (!res.ok) {
  console.error(`POST /quote ${res.status}`, JSON.stringify(json));
  process.exit(1);
}
console.log(JSON.stringify(json, null, 2));
