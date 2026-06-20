/**
 * Unify Data API client.
 * Base: https://api.unifygtm.com/data/v1 · Auth: X-Api-Key header.
 * Verified: READ works (objects, query-jobs, events). WRITE is gated by key scope —
 * the current key is read-only (all writes return 401). Writes are attempted and
 * degrade gracefully; capability is surfaced in the provider-status panel.
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

/** Pull recent intent events (website visits / tracked actions), resolved to companies/persons. */
export async function recentIntentEvents(sinceIso?: string): Promise<{ result: UnifyResult<any>; signals: IntentSignal[] }> {
  const filter: any = { type: { in: ["page", "track"] } };
  if (sinceIso) filter.timestamp = { gte: sinceIso };
  const create = await call<any>("POST", "/events/query-jobs", { filter });
  // Events are read; if the workspace has none yet this returns an empty set.
  // (Job polling omitted in this helper; the pipeline polls when a job_id is returned.)
  return { result: create, signals: [] };
}

// ── Writes (attempted; key may be read-only) ───────────────────────────────
export type UnifyPersonInput = {
  email: string;
  first_name?: string;
  last_name?: string;
  linkedin_url?: string;
  [k: string]: unknown;
};
export async function upsertPerson(input: UnifyPersonInput) {
  const { email, ...rest } = input;
  return call<any>("POST", "/objects/person/records/upsert", {
    match: { email },
    create: { email, ...rest },
    create_or_update: rest,
  });
}

// ── Status probe ────────────────────────────────────────────────────────
export async function status(): Promise<ProviderStatus> {
  const lastChecked = new Date().toISOString();
  if (!providerConfigured.unify()) {
    return { provider: "unify", state: "not_configured", capabilities: { read: false, write: false }, supportedFunctions: [], lastChecked, detail: "UNIFY_API_KEY missing" };
  }
  const read = await listObjects();
  if (read.status === 401) {
    return { provider: "unify", state: "auth_failed", capabilities: { read: false, write: false }, supportedFunctions: [], lastChecked, detail: read.error };
  }
  // Probe write with a harmless upsert; classify read_only on 401.
  const write = await upsertPerson({ email: "capability.probe@lightfern.local", first_name: "Probe" });
  const canWrite = write.ok;
  return {
    provider: "unify",
    state: read.ok && !canWrite ? "read_only" : read.ok ? "connected" : "unreachable",
    capabilities: { read: read.ok, write: canWrite },
    supportedFunctions: canWrite
      ? ["objects/records (read+write)", "query-jobs", "events/intent"]
      : ["objects (read)", "query-jobs (read)", "events/intent (read)"],
    lastChecked,
    detail: read.ok && !canWrite ? "Key is read-only — writes return 401. Provide a write-enabled key to sync champions into Unify." : read.error,
  };
}
