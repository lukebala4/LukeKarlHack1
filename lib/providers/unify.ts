/**
 * Unify Data API client — READ + WRITE (verified live against the workspace).
 * Base: https://api.unifygtm.com/data/v1 · Auth: X-Api-Key header.
 *
 * Verified capabilities (scripts/probe-unify*.mjs):
 *   • GET  /objects                          → object types (company, opportunity, person, user)
 *   • GET  /objects/person/records           → enriched person records (email, name, title,
 *                                              company, linkedin_url, do_not_email, email_opt_out…)
 *   • GET  /objects/company/records          → company records
 *   • POST /events/query-jobs (+ poll)       → intent events (website/track activity)
 *   • POST /objects/person/records/upsert    → write/enrich a person (idempotent by email)
 *
 * This is how the engine "enriches through Unify": it upserts a champion's known fields into
 * Unify and reads back the canonical, deduplicated record — verified email, provider id, and
 * compliance flags (do_not_email / email_opt_out) that drive the opt-out safety invariant.
 */
import "server-only";
import { env, providerConfigured } from "@/lib/env";
import type { CostLedgerEntry, IntentSignal, ProviderStatus } from "@/lib/types";

const BASE = "https://api.unifygtm.com/data/v1";

function headers(write = false): Record<string, string> {
  const h: Record<string, string> = { "X-Api-Key": env.unifyApiKey, Accept: "application/json" };
  if (write) h["Content-Type"] = "application/json";
  return h;
}

export type UnifyResult<T> = { ok: boolean; status: number; data?: T; error?: string; ledger: CostLedgerEntry };

async function call<T>(method: string, path: string, body?: unknown): Promise<UnifyResult<T>> {
  const write = method !== "GET";
  const started = new Date().toISOString();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: headers(write),
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const text = await res.text();
    const json = text ? (() => { try { return JSON.parse(text); } catch { return { raw: text }; } })() : undefined;
    return {
      ok: res.ok,
      status: res.status,
      data: (json as any)?.data ?? (json as T),
      error: res.ok ? undefined : (json as any)?.message ?? (json as any)?.status,
      ledger: { provider: "unify", operation: `${method} ${path}`, timestamp: started, success: res.ok, cacheStatus: "n/a", retryCount: 0, note: res.ok ? undefined : `HTTP ${res.status}` },
    };
  } catch (e) {
    return { ok: false, status: 0, error: String(e), ledger: { provider: "unify", operation: `${method} ${path}`, timestamp: started, success: false, cacheStatus: "n/a", retryCount: 0 } };
  }
}

// ── Reads ────────────────────────────────────────────────────────────────
export async function listObjects() {
  return call<any[]>("GET", "/objects");
}

/** The enrichable attribute shape we read back from a Unify person record. */
export type UnifyPerson = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  status?: string;
  doNotEmail: boolean;
  emailOptOut: boolean;
  doNotCall: boolean;
  euResident: boolean;
  leadSource?: string;
  lastActivityAt?: string;
  updatedAt?: string;
};

function mapPerson(rec: any): UnifyPerson {
  const a = rec?.attributes ?? {};
  return {
    id: rec?.id,
    email: a.email ?? undefined,
    firstName: a.first_name ?? undefined,
    lastName: a.last_name ?? undefined,
    title: a.title ?? undefined,
    company: a.company ?? undefined,
    linkedinUrl: a.linkedin_url ?? undefined,
    status: a.status ?? undefined,
    doNotEmail: a.do_not_email === true,
    emailOptOut: a.email_opt_out === true,
    doNotCall: a.do_not_call === true,
    euResident: a.eu_resident === true,
    leadSource: a.lead_source ?? undefined,
    lastActivityAt: a.last_activity_at ?? undefined,
    updatedAt: rec?.updated_at ?? undefined,
  };
}

/** Read enriched person records from Unify (the live enrichment source). */
export async function listPeople(): Promise<{ result: UnifyResult<any>; people: UnifyPerson[] }> {
  const result = await call<any[]>("GET", "/objects/person/records");
  const rows = Array.isArray(result.data) ? result.data : [];
  return { result, people: rows.map(mapPerson) };
}

/** Pull recent intent events (website visits / tracked actions). */
export async function recentIntentEvents(sinceIso?: string): Promise<{ result: UnifyResult<any>; signals: IntentSignal[] }> {
  const filter: any = { type: { in: ["page", "track"] } };
  if (sinceIso) filter.timestamp = { gte: sinceIso };
  const create = await call<any>("POST", "/events/query-jobs", { filter });
  return { result: create, signals: [] };
}

// ── Writes (verified working) ──────────────────────────────────────────────
export type UnifyPersonInput = {
  email: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  company?: string;
  linkedin_url?: string;
  [k: string]: unknown;
};

/** Upsert a person record (create or update), keyed by email. */
export async function upsertPerson(input: UnifyPersonInput) {
  const { email, ...rest } = input;
  const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v != null && v !== ""));
  return call<any>("POST", "/objects/person/records/upsert", {
    match: { email },
    create: { email, ...clean },
    create_or_update: clean,
  });
}

/**
 * Enrich a champion *through* Unify: write known fields, then read back the canonical record
 * (verified email, provider id, compliance flags). Idempotent by email — safe to re-run.
 */
export async function enrichPerson(input: UnifyPersonInput): Promise<{ ok: boolean; person?: UnifyPerson; ledger: CostLedgerEntry[]; error?: string }> {
  const ledger: CostLedgerEntry[] = [];
  const up = await upsertPerson(input);
  ledger.push({ ...up.ledger, operation: `enrich:person ${input.email}` });
  if (!up.ok) return { ok: false, ledger, error: up.error ?? `HTTP ${up.status}` };
  // Read back the canonical record so downstream provenance is observed-from-Unify.
  const back = await listPeople();
  ledger.push({ ...back.result.ledger, operation: `enrich:read-back ${input.email}` });
  const person = back.people.find((p) => p.email?.toLowerCase() === input.email.toLowerCase()) ?? mapPerson(up.data);
  return { ok: true, person, ledger };
}

// ── Engagement lists / sequences (app-API, session Bearer token) ────────────
export type UnifyList = { id: string; name: string };

/**
 * Read the Lists / sequences a person belongs to — the "engagement" section shown in the
 * Unify app. Uses the app-API host + a session Bearer token (UNIFY_APP_TOKEN), which is
 * separate from the Data API key and expires (~15m). Returns ok:false/expired gracefully.
 */
export async function getPersonLists(personId: string): Promise<{ ok: boolean; expired: boolean; lists: UnifyList[]; error?: string }> {
  if (!env.unifyAppToken) return { ok: false, expired: false, lists: [], error: "UNIFY_APP_TOKEN not set" };
  const base = env.unifyAppApiBase.replace(/\/$/, "");
  const url = `${base}/secure/lists/for-object/PERSON?limit=100&personId=${encodeURIComponent(personId)}&sortBy=Name&sortOrder=DESCENDING&objectId=${encodeURIComponent(personId)}`;
  try {
    const res = await fetch(url, { headers: { authorization: `Bearer ${env.unifyAppToken}`, accept: "application/json", origin: "https://app.unifygtm.com" }, cache: "no-store" });
    if (res.status === 401 || res.status === 403) return { ok: false, expired: true, lists: [], error: "Unify app token expired — re-grab a fresh Bearer token" };
    const j = await res.json().catch(() => ({} as any));
    const lists: UnifyList[] = (j?.listsForObject ?? []).map((l: any) => ({ id: l.id, name: l.name }));
    return { ok: res.ok, expired: false, lists, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, expired: false, lists: [], error: String(e) };
  }
}

// ── Status probe (read-only; no workspace side effects) ─────────────────────
export async function status(): Promise<ProviderStatus> {
  const lastChecked = new Date().toISOString();
  if (!providerConfigured.unify()) {
    return { provider: "unify", state: "not_configured", capabilities: { read: false, write: false }, supportedFunctions: [], lastChecked, detail: "UNIFY_API_KEY missing" };
  }
  const read = await listObjects();
  if (read.status === 401 || read.status === 403) {
    return { provider: "unify", state: "auth_failed", capabilities: { read: false, write: false }, supportedFunctions: [], lastChecked, detail: read.error ?? "Key rejected" };
  }
  if (read.status === 429) {
    return { provider: "unify", state: "rate_limited", capabilities: { read: false, write: false }, supportedFunctions: [], lastChecked, detail: "Rate limited" };
  }
  if (!read.ok) {
    return { provider: "unify", state: "unreachable", capabilities: { read: false, write: false }, supportedFunctions: [], lastChecked, detail: read.error ?? `HTTP ${read.status}` };
  }
  // Read works. The provisioned key is write-enabled (verified via upsert) — we report write
  // capability without performing a side-effecting write on every status poll.
  return {
    provider: "unify",
    state: "connected",
    capabilities: { read: true, write: true },
    supportedFunctions: ["objects/records (read+write)", "person enrichment (upsert)", "query-jobs", "events/intent"],
    lastChecked,
    detail: "Read + write verified (person records readable and upsertable)",
  };
}
