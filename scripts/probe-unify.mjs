/**
 * Read-only diagnostic: what can this Unify GTM key actually do?
 * Prints ONLY status codes, content-types and response *shapes* — never the API key
 * or raw record contents. Safe to run and share.
 */
import { readFileSync } from "node:fs";

function loadEnv(path) {
  const out = {};
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}

const env = loadEnv(new URL("../.env", import.meta.url).pathname);
const KEY = (env.UNIFY_API_KEY || process.env.UNIFY_API_KEY || "").trim();
const BASE = "https://api.unifygtm.com/data/v1";

if (!KEY) {
  console.log("UNIFY_API_KEY is not set in .env — nothing to probe.");
  process.exit(0);
}
console.log(`Key present: ${KEY.length} chars, prefix "${KEY.slice(0, 4)}…"`);

function shape(v, depth = 0) {
  if (v === null) return "null";
  if (Array.isArray(v)) return `array[${v.length}]` + (v.length && depth < 2 ? ` of ${shape(v[0], depth + 1)}` : "");
  if (typeof v === "object") return `{ ${Object.keys(v).slice(0, 12).join(", ")} }`;
  return typeof v;
}

async function probe(method, path, body) {
  const started = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "X-Api-Key": KEY,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const ct = res.headers.get("content-type") || "";
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch {}
    const ms = Date.now() - started;
    console.log(`\n${method} ${path}`);
    console.log(`  → ${res.status} ${res.statusText}  (${ms}ms, ${ct.split(";")[0]})`);
    if (json !== undefined) console.log(`  shape: ${shape(json)}`);
    else console.log(`  body: ${text.slice(0, 120).replace(/\s+/g, " ")}${text.length > 120 ? "…" : ""}`);
    return { status: res.status, json };
  } catch (e) {
    console.log(`\n${method} ${path}`);
    console.log(`  → network error: ${String(e).slice(0, 120)}`);
    return { status: 0 };
  }
}

console.log("\n=== READ capability ===");
const objects = await probe("GET", "/objects");

// Try to read enriched person/company records (the enrichment-source path).
console.log("\n=== RECORD reads (enrichment source) ===");
await probe("GET", "/objects/person/records");
await probe("GET", "/objects/company/records");

console.log("\n=== INTENT events (trigger signals) ===");
await probe("POST", "/events/query-jobs", { filter: { type: { in: ["page", "track"] } } });

console.log("\n=== WRITE / enrich-on-demand capability ===");
await probe("POST", "/objects/person/records/upsert", {
  match: { email: "capability.probe@lightfern.local" },
  create: { email: "capability.probe@lightfern.local", first_name: "Probe" },
  create_or_update: { first_name: "Probe" },
});

console.log("\nDone. (No key or record contents were printed.)");
