/**
 * Scaile client — inbound / AI-search visibility.
 *
 * Scaile is a managed AI-visibility content engine. Its documented API shape is:
 *   POST {base}/articles { topic }            -> { id, status }
 *   GET  {base}/articles/{id}                 -> { id, status, ... } (poll until "ready")
 * with Authorization: Bearer scl_live_...
 *
 * IMPORTANT: from a server context, the host given to us (app.scaile.to) returns the
 * frontend SPA (text/html) for every /api path and 405 on POST — i.e. no API is mounted
 * there reachable from outside the app. Set SCAILE_API_BASE to the REAL backend host
 * (copy it from the dashboard's DevTools → Network tab) to activate live calls. Until
 * then this provider still produces the inbound STRATEGY artifacts you paste into Scaile.
 */
import "server-only";
import { env, providerConfigured } from "@/lib/env";
import type { CostLedgerEntry, ProviderStatus } from "@/lib/types";

/** ICP-aligned queries our buyers type into ChatGPT/Claude/Perplexity. The inbound target set. */
export const AI_SEARCH_QUERY_MAP: { query: string; intent: string; missionAligned: boolean }[] = [
  { query: "AI writing tool that matches my own voice", intent: "voice-preservation", missionAligned: true },
  { query: "how to write outbound emails that don't sound like AI", intent: "anti-slop outbound", missionAligned: true },
  { query: "best autocomplete for high-stakes email", intent: "high-stakes comms", missionAligned: true },
  { query: "alternative to generic AI that makes everything sound the same", intent: "homogeneity pain", missionAligned: true },
  { query: "AI email tool for founders and GTM leaders", intent: "ICP fit", missionAligned: false },
  { query: "how to keep my writing voice using AI", intent: "voice-preservation", missionAligned: true },
  { query: "tool to improve sales email reply rates without templates", intent: "outbound performance", missionAligned: false },
  { query: "Lightfern vs generic AI writing assistants", intent: "brand", missionAligned: false },
];

/** Content briefs to feed Scaile (or generate locally) — each targets a query above. */
export const CONTENT_BRIEFS = [
  { title: "In Defence of Individuality: writing in the age of AI slop", angle: "mission manifesto → brand", targetQuery: "alternative to generic AI that makes everything sound the same" },
  { title: "The reply-rate collapse: why your outbound stopped working in 2026", angle: "GTM pain → product", targetQuery: "how to write outbound emails that don't sound like AI" },
  { title: "Voice-preserving AI: keep your taste, lose the em-dash mush", angle: "feature → ICP", targetQuery: "AI writing tool that matches my own voice" },
];

type Json = Record<string, any>;

async function call(method: string, path: string, body?: unknown): Promise<{ ok: boolean; status: number; isJson: boolean; data?: Json; error?: string; ledger: CostLedgerEntry }> {
  const base = env.scaileApiBase.replace(/\/$/, "");
  const started = new Date().toISOString();
  try {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { Authorization: `Bearer ${env.scaileApiKey}`, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const ct = res.headers.get("content-type") ?? "";
    const isJson = ct.includes("application/json");
    const text = await res.text();
    const data = isJson ? (() => { try { return JSON.parse(text); } catch { return undefined; } })() : undefined;
    return {
      ok: res.ok && isJson,
      status: res.status,
      isJson,
      data,
      error: res.ok && isJson ? undefined : isJson ? `HTTP ${res.status}` : "non-JSON response (SPA/Cloudflare — wrong host?)",
      ledger: { provider: "scaile", operation: `${method} ${path}`, timestamp: started, success: res.ok && isJson, cacheStatus: "n/a", retryCount: 0, note: isJson ? undefined : "non-JSON" },
    };
  } catch (e) {
    return { ok: false, status: 0, isJson: false, error: String(e), ledger: { provider: "scaile", operation: `${method} ${path}`, timestamp: started, success: false, cacheStatus: "n/a", retryCount: 0 } };
  }
}

export async function generateArticle(topic: string) {
  return call("POST", "/articles", { topic });
}
export async function getArticle(id: string) {
  return call("GET", `/articles/${id}`);
}

export async function status(): Promise<ProviderStatus> {
  const lastChecked = new Date().toISOString();
  if (!env.scaileApiKey) {
    return { provider: "scaile", state: "not_configured", capabilities: { read: false, write: false }, supportedFunctions: [], lastChecked, detail: "SCAILE_API_KEY missing" };
  }
  if (!providerConfigured.scaile()) {
    return { provider: "scaile", state: "not_configured", capabilities: { read: false, write: false }, supportedFunctions: ["AI-search query map", "content briefs (dashboard-driven)"], lastChecked, detail: "SCAILE_API_BASE not set." };
  }
  // Probe the articles endpoint; classify SPA-HTML as unreachable (wrong/forbidden host).
  const probe = await call("GET", "/articles");
  if (!probe.isJson) {
    return { provider: "scaile", state: "unreachable", capabilities: { read: false, write: false }, supportedFunctions: ["AI-search query map", "content briefs (dashboard-driven)"], lastChecked, detail: "Host returns SPA HTML, not API JSON. Set SCAILE_API_BASE to the real backend host (DevTools → Network)." };
  }
  return {
    provider: "scaile",
    state: probe.status === 401 ? "auth_failed" : probe.ok ? "connected" : "unreachable",
    capabilities: { read: probe.ok, write: probe.ok },
    supportedFunctions: ["articles (generate/poll)", "AI-search visibility", "content engine"],
    lastChecked,
    detail: probe.ok ? "API reachable (JSON)" : probe.error,
  };
}
