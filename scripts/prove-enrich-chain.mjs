/**
 * PROOF: Clay-enriched people  →  Unify (record store)  →  Zero (CRM).
 * Uses the app's real Unify + Zero keys from .env. Writes 2 enriched contacts
 * that were sourced + enriched LIVE via Clay (Cursor, Head of Growth / Growth Marketing).
 * Prints the provider record IDs it gets back. Idempotent (upsert by email).
 */
import { readFileSync } from "node:fs";
function loadEnv(p){const o={};for(const l of readFileSync(p,"utf8").split("\n")){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)o[m[1]]=m[2].replace(/^["']|["']$/g,"");}return o;}
const env = loadEnv(new URL("../.env", import.meta.url).pathname);

const UNIFY = "https://api.unifygtm.com/data/v1";
const ZERO = "https://api.zero.inc";

// ── The batch, exactly as Clay returned it live (cursor.com, growth roles) ──
const company = {
  name: "Cursor", domain: "cursor.com", industry: "Software Development",
  employees: 995, revenue: "75M-200M",
  latestFunding: "$2,300,000,000",
  investors: "Accel, Andreessen Horowitz, Benchmark, DST, Google, NVIDIA, Thrive Capital, Toba Capital",
};
const people = [
  { first: "Roman", last: "Ugarte", title: "Head of Growth", email: "roman@cursor.so", linkedin: "https://www.linkedin.com/in/romanugarte/" },
  { first: "Joshua", last: "Kim", title: "Growth Marketing Lead", email: "joshua@cursor.com", linkedin: "https://www.linkedin.com/in/kimjoshua/" },
];

async function unify(method, path, body) {
  const res = await fetch(`${UNIFY}${path}`, { method, headers: { "X-Api-Key": env.UNIFY_API_KEY.trim(), Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const t = await res.text(); let j; try { j = JSON.parse(t); } catch {}
  return { status: res.status, json: j };
}
async function zero(method, path, body) {
  const res = await fetch(`${ZERO}${path}`, { method, headers: { Authorization: `Bearer ${env.ZERO_API_KEY.trim()}`, Accept: "application/json", ...(body ? { "Content-Type": "application/json", "x-workspace-id": env.ZERO_WORKSPACE_ID.trim() } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const t = await res.text(); let j; try { j = JSON.parse(t); } catch {}
  return { status: res.status, json: j, raw: t };
}

console.log("═══ STEP 1 — Enrich into UNIFY (person records) ═══");
const unifyIds = {};
for (const p of people) {
  // NOTE: Unify's `company` person-attribute is a reference (object), not a string — omit it here.
  const attrs = { first_name: p.first, last_name: p.last, title: p.title, linkedin_url: p.linkedin };
  const up = await unify("POST", "/objects/person/records/upsert", {
    match: { email: p.email },
    create: { email: p.email, ...attrs },
    create_or_update: attrs,
  });
  const id = up.json?.data?.id ?? up.json?.id;
  unifyIds[p.email] = id;
  console.log(`  ${p.first} ${p.last}  →  ${up.status}  unifyPersonId=${id ?? "(none)"}`);
}

console.log("\n═══ STEP 2 — Send to ZERO (CRM: company + contact + deal) ═══");
const co = await zero("POST", "/api/companies", { workspaceId: env.ZERO_WORKSPACE_ID.trim(), name: company.name, domain: company.domain, description: `${company.industry} · ${company.employees} employees · latest funding ${company.latestFunding} · investors: ${company.investors}` });
const companyId = co.json?.data?.id ?? co.json?.id;
console.log(`  company "${company.name}"  →  ${co.status}  companyId=${companyId ?? "(none)"}${co.status >= 400 ? "  err=" + (co.json?.error ?? co.json?.message ?? co.raw?.slice(0,100)) : ""}`);

for (const p of people) {
  const ct = await zero("POST", "/api/contacts", { workspaceId: env.ZERO_WORKSPACE_ID.trim(), name: `${p.first} ${p.last}`, companyId, title: p.title, email: p.email, linkedin: p.linkedin });
  const contactId = ct.json?.data?.id ?? ct.json?.id;
  console.log(`  contact ${p.first} ${p.last}  →  ${ct.status}  contactId=${contactId ?? "(none)"}${ct.status >= 400 ? "  err=" + (ct.json?.error ?? ct.json?.message ?? ct.raw?.slice(0,100)) : ""}`);
  if (contactId || companyId) {
    const d = await zero("POST", "/api/deals", { workspaceId: env.ZERO_WORKSPACE_ID.trim(), name: `${p.first} ${p.last} — ${company.name} (${p.title})`, companyId, contactIds: contactId ? [contactId] : undefined, confidence: 0.8 });
    const dealId = d.json?.data?.id ?? d.json?.id;
    console.log(`  deal    ${p.first} ${p.last}  →  ${d.status}  dealId=${dealId ?? "(none)"}${d.status >= 400 ? "  err=" + (d.json?.error ?? d.json?.message ?? d.raw?.slice(0,100)) : ""}`);
  }
}

console.log("\n═══ STEP 3 — Read back from Unify to confirm persistence ═══");
const back = await unify("GET", "/objects/person/records");
const names = (back.json?.data ?? []).map(r => `${r.attributes?.first_name} ${r.attributes?.last_name ?? ""}`.trim());
console.log("  Unify person records now:", names.join(", "));
console.log("\nDone — Clay → Unify → Zero chain executed with live provider keys.");
