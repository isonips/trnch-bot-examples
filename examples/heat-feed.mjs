// Poll the live Heat and print tokens that just entered it.
// Run: node --env-file=.env examples/heat-feed.mjs
const API = "https://trnch.fun/api/bot/v1";
const key = process.env.TRNCH_BOT_KEY;
if (!key) {
  console.error("Missing TRNCH_BOT_KEY (copy .env.example to .env and fill it).");
  process.exit(1);
}

const POLL_MS = 5000; // 12 calls a minute; the documented limit is 60 per key.
let since; // undefined on the first call: the whole current race.

async function poll() {
  const url = new URL(API + "/heat");
  if (since !== undefined) url.searchParams.set("since", String(since));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`GET /heat ${res.status} ${JSON.stringify(body)}`);
  for (const t of body.tokens) {
    console.log(`#${t.rank} ${t.symbol} ${t.token} heat=${t.heatScore} liq=$${t.liquidityUsd} price=$${t.priceUsd}`);
  }
  since = body.nextSince; // pass it back as-is on the next call.
}

for (;;) {
  try {
    await poll();
  } catch (err) {
    console.error(String(err.message ?? err));
    if (/ 401 /.test(err.message)) process.exit(1);
  }
  await new Promise((r) => setTimeout(r, POLL_MS));
}
