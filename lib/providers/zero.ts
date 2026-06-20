/**
 * Zero CRM client — READ + WRITE (verified live).
 * Base: https://api.zero.inc  · Auth: Authorization: Bearer + x-workspace-id header.
 * Writes require the x-workspace-id header; reads work with Bearer alone.
 */
import "server-only";
import { env, providerConfigured } from "@/lib/env";
import type { CostLedgerEntry, ProviderStatus } from "@/lib/types";

const BASE = "https://api.zero.inc";

function headers(write = false): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${env.zeroApiKey}`,
    Accept: "application/json",
  };
  if (write) {
    h["Content-Type"] = "application/json";
    h["x-workspace-id"] = env.zeroWorkspaceId;
  }
  return h;
}

export type ZeroResult<T> = { ok: boolean; status: number; data?: T; error?: string; ledger: CostLedgerEntry };

async function call<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ZeroResult<T>> {
  const write = method !== "GET";
  const started = new Date().toISOString();
  let retryCount = 0;
  // simple exponential backoff for 429/5xx, capped
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: headers(write),
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });
      const text = await res.text();
      const json = text ? safeJson(text) : undefined;
      const ledger: CostLedgerEntry = {
        provider: "zero",
        operation: `${method} ${path}`,
        timestamp: started,
        success: res.ok,
        cacheStatus: "n/a",
        retryCount,
        note: res.ok ? undefined : (json as any)?.error ?? (json as any)?.message ?? `HTTP ${res.status}`,
      };
      if ((res.status === 429 || res.status >= 500) && attempt < 2) {
        retryCount++;
        await sleep(250 * 2 ** attempt);
        continue;
      }
      return {
        ok: res.ok,
        status: res.status,
        data: (json as any)?.data ?? (json as T),
        error: res.ok ? undefined : (json as any)?.error ?? (json as any)?.message,
        ledger,
      };
    } catch (e) {
      if (attempt < 2) {
        retryCount++;
        await sleep(250 * 2 ** attempt);
        continue;
      }
      return {
        ok: false,
        status: 0,
        error: String(e),
        ledger: { provider: "zero", operation: `${method} ${path}`, timestamp: started, success: false, cacheStatus: "n/a", retryCount },
      };
    }
  }
  // unreachable
  return { ok: false, status: 0, error: "exhausted", ledger: { provider: "zero", operation: `${method} ${path}`, timestamp: started, success: false, cacheStatus: "n/a", retryCount } };
}

function safeJson(t: string): unknown {
  try { return JSON.parse(t); } catch { return { raw: t }; }
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Reads ────────────────────────────────────────────────────────────────
export async function listCompanies() {
  return call<any[]>("GET", "/api/companies");
}
export async function listContacts() {
  return call<any[]>("GET", "/api/contacts");
}
export async function listPipelines() {
  return call<any[]>("GET", "/api/pipelines");
}

// ── Writes ───────────────────────────────────────────────────────────────
export type ZeroCompanyInput = { name: string; domain?: string; description?: string; linkedin?: string; custom?: Record<string, unknown> };
export async function upsertCompany(input: ZeroCompanyInput) {
  // Zero rejects malformed domains; only pass when it looks like a hostname.
  const domain = input.domain && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(input.domain) ? input.domain : undefined;
  return call<any>("POST", "/api/companies", { workspaceId: env.zeroWorkspaceId, ...input, domain });
}

export type ZeroContactInput = {
  name: string;
  companyId?: string;
  email?: string;
  title?: string;
  phone?: string;
  linkedin?: string;
  x?: string;
  custom?: Record<string, unknown>;
};
export async function createContact(input: ZeroContactInput) {
  return call<any>("POST", "/api/contacts", { workspaceId: env.zeroWorkspaceId, ...input });
}

export type ZeroDealInput = {
  name: string;
  companyId?: string;
  contactIds?: string[];
  stage?: string;
  value?: number;
  confidence?: number; // 0..1
  custom?: Record<string, unknown>;
};
export async function createDeal(input: ZeroDealInput) {
  return call<any>("POST", "/api/deals", { workspaceId: env.zeroWorkspaceId, ...input });
}

export async function deleteRecord(resource: "companies" | "contacts" | "deals", id: string) {
  return call<any>("DELETE", `/api/${resource}/${id}`);
}

// ── Status probe ────────────────────────────────────────────────────────
export async function status(): Promise<ProviderStatus> {
  const lastChecked = new Date().toISOString();
  if (!providerConfigured.zero()) {
    return { provider: "zero", state: "not_configured", capabilities: { read: false, write: false }, supportedFunctions: [], lastChecked, detail: "ZERO_API_KEY / ZERO_WORKSPACE_ID missing" };
  }
  const r = await listCompanies();
  if (r.status === 401) {
    return { provider: "zero", state: "auth_failed", capabilities: { read: false, write: false }, supportedFunctions: [], lastChecked, detail: r.error };
  }
  return {
    provider: "zero",
    state: r.ok ? "connected" : "unreachable",
    capabilities: { read: r.ok, write: r.ok },
    supportedFunctions: ["companies", "contacts", "deals", "pipelines", "CRM pipeline sync"],
    lastChecked,
    detail: r.ok ? "Read + write verified" : r.error,
  };
}
