// Receive the "token entered the Heat" webhook and verify X-TRNCH-Signature.
// Run: node --env-file=.env examples/heat-webhook.mjs
import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";

const secret = process.env.TRNCH_WEBHOOK_SECRET;
const port = Number(process.env.PORT ?? 3000);
if (!secret) {
  console.error("Missing TRNCH_WEBHOOK_SECRET (the whsec_... secret shown when you save the URL).");
  process.exit(1);
}
const TOLERANCE_S = 300; // reject a timestamp more than 5 minutes off

// Header: t=<unix seconds>,v1=<hex>. v1 = HMAC-SHA256 of "<t>.<raw body>" with the secret.
function verify(header, rawBody, nowS = Math.floor(Date.now() / 1000)) {
  const m = /^t=(\d{1,12}),v1=([0-9a-f]{64})$/.exec(header ?? "");
  if (!m) return false;
  const t = Number(m[1]);
  if (Math.abs(nowS - t) > TOLERANCE_S) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`, "utf8").digest();
  return timingSafeEqual(expected, Buffer.from(m[2], "hex"));
}

const seen = new Set(); // event ids are stable per token: dedupe on them.

createServer((req, res) => {
  if (req.method !== "POST") {
    res.writeHead(405).end();
    return;
  }
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const raw = Buffer.concat(chunks).toString("utf8"); // sign-check the RAW body, not re-serialized JSON
    if (!verify(req.headers["x-trnch-signature"], raw)) {
      res.writeHead(401).end("bad signature");
      return;
    }
    res.writeHead(200).end("ok"); // answer 2xx within 3 seconds
    let ev;
    try {
      ev = JSON.parse(raw);
    } catch {
      return;
    }
    if (ev.event !== "heat.entry" || seen.has(ev.id)) return;
    seen.add(ev.id);
    const t = ev.token;
    console.log(`entered the Heat: ${t.symbol} ${t.token} rank=${t.rank} heat=${t.heatScore} liq=$${t.liquidityUsd}`);
  });
}).listen(port, () => console.log(`listening on :${port}`));
