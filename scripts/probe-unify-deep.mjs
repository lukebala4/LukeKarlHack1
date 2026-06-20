/**
 * Deeper read-only diagnostic of the Unify workspace.
 * Prints object types, record COUNTS, and the FIELD NAMES available on records
 * (so we know what enrichment data we can route through) — never field values/PII.
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
const KEY = (env.UNIFY_API_KEY || "").trim();
const BASE = "https://api.unifygtm.com/data/v1";

async function get(path, body, method = body ? "POST" : "GET") {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "X-Api-Key": KEY, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("=== Object types ===");
const objs = await get("/objects");
const types = objs.json?.data ?? objs.json ?? [];
for (const o of Array.isArray(types) ? types : []) {
  console.log(`  • ${o.api_name ?? o.name ?? o.id}  ${o.label ? `(${o.label})` : ""}`);
}

for (const type of ["person", "company"]) {
  console.log(`\n=== ${type} records ===`);
  const r = await get(`/objects/${type}/records`);
  const data = r.json?.data ?? [];
  console.log(`  count on first page: ${Array.isArray(data) ? data.length : "?"}`);
  console.log(`  cursor: ${r.json?.cursor ? "yes (more pages)" : "none"}`);
  const first = Array.isArray(data) ? data[0] : undefined;
  if (first) {
    console.log(`  top-level keys: ${Object.keys(first).join(", ")}`);
    const attrs = first.attributes ?? first.properties ?? first.values ?? first.data;
    if (attrs && typeof attrs === "object") {
      console.log(`  attribute field names (${Object.keys(attrs).length}): ${Object.keys(attrs).join(", ")}`);
    }
  } else {
    console.log("  (no records on first page)");
  }
}

console.log("\n=== Intent events (poll the query job) ===");
const job = await get("/events/query-jobs", { filter: { type: { in: ["page", "track"] } } });
const jobId = job.json?.job_id;
console.log(`  job_id: ${jobId ? "created" : "none"}  status: ${job.json?.status}`);
if (jobId) {
  for (let i = 0; i < 4; i++) {
    await sleep(900);
    const poll = await get(`/events/query-jobs/${jobId}`);
    const st = poll.json?.status;
    const rows = poll.json?.data ?? poll.json?.results ?? [];
    console.log(`  poll ${i + 1}: status=${st} rows=${Array.isArray(rows) ? rows.length : "?"}`);
    if (st && st !== "pending" && st !== "running") {
      if (Array.isArray(rows) && rows[0]) console.log(`  event keys: ${Object.keys(rows[0]).join(", ")}`);
      break;
    }
  }
}

console.log("\nDone.");
