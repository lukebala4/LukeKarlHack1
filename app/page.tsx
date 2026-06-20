"use client";

import { useEffect, useMemo, useState } from "react";

type Evidence = { ruleId: string; axis: string; signal: string; detail: string; points: number; sourceUrl?: string };
type Prospect = {
  id: string; name: string; title?: string; location?: string;
  company: { name: string; domain?: string; isAiNative?: boolean; fundingStage?: string };
  linkedin?: string; x?: string; website?: string;
  signals: Record<string, any>;
  intent: { type: string; summary: string; sourceUrl?: string }[];
  content: { title: string; kind: string; themes: string[]; url?: string }[];
  contactRoutes: { channel: string; value?: string; verified: boolean; confidence: number }[];
  score: { total: number; reachScore: number; missionScore: number; emailVolumeScore: number; tier: "A" | "B" | "C" | "D"; isChampion: boolean; rationale: string; evidence: Evidence[] };
  channel: { primary: string; secondary?: string; timing: string; reason: string };
  personalization?: { triggerEvent?: string; valueProp: string; hook: string; cta: string; draftOpener: string; warmIntroPath?: string; evidence: string[] };
  status: string;
  provenance: { field: string; value: any; provider: string; sourceType: string; verified: boolean; confidence: number }[];
};
type Provider = { provider: string; state: string; capabilities: { read: boolean; write: boolean }; supportedFunctions: string[]; detail?: string };

const tierColor: Record<string, string> = { A: "#16a34a", B: "#d97706", C: "#64748b", D: "#3f4654" };

export default function Page() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [synced, setSynced] = useState<Record<string, any>>({});
  const [tab, setTab] = useState<"outbound" | "inbound">("outbound");
  const [inbound, setInbound] = useState<any>(null);

  useEffect(() => {
    fetch("/api/pipeline").then((r) => r.json()).then((d) => { setProspects(d.prospects); setStats(d.stats); });
    fetch("/api/status").then((r) => r.json()).then((d) => setProviders(d.providers));
    fetch("/api/scaile").then((r) => r.json()).then(setInbound);
  }, []);

  async function sync(id: string, targets: string[]) {
    setSyncing(id);
    try {
      const r = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prospectId: id, targets }) });
      const json = await r.json();
      setSynced((s) => ({ ...s, [id]: json }));
    } finally { setSyncing(null); }
  }

  const champions = prospects.filter((p) => p.score.isChampion);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="flex items-start justify-between gap-6 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">🌿 Lightfern Champion Engine</h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Finds <span className="text-neutral-200">champions, not just users</span> — AI-native B2B SaaS GTM operators who are high-reach <em>and</em> mission-aligned —
            scores them on transparent evidence, and pushes outreach-ready leads into Zero + Unify. Outbound-as-craft: the proof is the message.
          </p>
        </div>
        <ProviderPanel providers={providers} />
      </header>

      <div className="flex gap-2 mb-6">
        <Tab active={tab === "outbound"} onClick={() => setTab("outbound")}>Outbound — Champions</Tab>
        <Tab active={tab === "inbound"} onClick={() => setTab("inbound")}>Inbound — AI Search (Scaile)</Tab>
        <a href="/api/export" className="ml-auto text-xs px-3 py-2 rounded-md border border-neutral-700 hover:bg-neutral-800">⭳ Export CSV</a>
      </div>

      {tab === "outbound" && (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <Stat label="Discovered" value={stats.discovered} />
              <Stat label="Champions (Tier A)" value={stats.champions} accent="#16a34a" />
              <Stat label="Tier B" value={stats.tiers.B} accent="#d97706" />
              <Stat label="Enriched" value={stats.enriched} />
              <Stat label="Dropped (low-fit gate)" value={stats.droppedLowFit} />
            </div>
          )}

          <div className="grid md:grid-cols-[320px_1fr] gap-6">
            <Quadrant prospects={prospects} />
            <div className="space-y-3">
              {prospects.map((p) => (
                <Card key={p.id} p={p} open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)}
                  onSync={sync} syncing={syncing === p.id} synced={synced[p.id]} providers={providers} />
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "inbound" && <Inbound inbound={inbound} />}

      <footer className="mt-10 text-xs text-neutral-500 border-t border-neutral-800 pt-4">
        Champions found: <b className="text-neutral-300">{champions.length}</b>. All scores are evidence-backed (click a card).
        Live writes go to Zero (CRM) + Unify (records). <b>No messages are sent</b> — sync produces “outreach-ready” only.
      </footer>
    </div>
  );
}

function Tab({ active, onClick, children }: any) {
  return <button onClick={onClick} className={`text-sm px-3 py-2 rounded-md border ${active ? "border-fern bg-fern/10 text-white" : "border-neutral-700 text-neutral-400 hover:bg-neutral-800"}`}>{children}</button>;
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
      <div className="text-2xl font-semibold" style={{ color: accent }}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 mt-1">{label}</div>
    </div>
  );
}

function ProviderPanel({ providers }: { providers: Provider[] }) {
  const dot: Record<string, string> = { connected: "#16a34a", read_only: "#d97706", auth_failed: "#ef4444", not_configured: "#64748b", unreachable: "#ef4444", rate_limited: "#d97706" };
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 min-w-[230px]">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">Provider status</div>
      <div className="space-y-1.5">
        {providers.map((p) => (
          <div key={p.provider} className="flex items-center gap-2 text-xs" title={p.detail}>
            <span className="w-2 h-2 rounded-full" style={{ background: dot[p.state] ?? "#64748b" }} />
            <span className="capitalize w-14">{p.provider}</span>
            <span className="text-neutral-400">{p.state.replace("_", " ")}</span>
            <span className="ml-auto text-neutral-600">{p.capabilities.read ? "R" : "-"}{p.capabilities.write ? "W" : "-"}</span>
          </div>
        ))}
        {providers.length === 0 && <div className="text-xs text-neutral-500">checking…</div>}
      </div>
    </div>
  );
}

function Quadrant({ prospects }: { prospects: Prospect[] }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 h-fit sticky top-4">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2">Champion quadrant</div>
      <div className="relative w-full aspect-square border-l border-b border-neutral-700">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 text-[9px] text-neutral-600">
          <div className="border-r border-b border-neutral-800 flex items-start justify-start p-1">good user</div>
          <div className="border-b border-neutral-800 flex items-start justify-end p-1 text-fernlight">★ champion</div>
          <div className="border-r border-neutral-800 flex items-end justify-start p-1">low fit</div>
          <div className="flex items-end justify-end p-1">megaphone</div>
        </div>
        {prospects.map((p) => (
          <div key={p.id} title={`${p.name} — reach ${p.score.reachScore}, mission ${p.score.missionScore}`}
            className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 translate-y-1/2"
            style={{ left: `${p.score.reachScore}%`, bottom: `${p.score.missionScore}%`, background: tierColor[p.score.tier], boxShadow: p.score.isChampion ? "0 0 0 3px rgba(22,163,74,.25)" : undefined }} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-neutral-500 mt-1"><span>reach →</span><span>↑ mission</span></div>
    </div>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return <div className="bar w-full"><span style={{ width: `${value}%`, background: color }} /></div>;
}

function Card({ p, open, onToggle, onSync, syncing, synced, providers }: any) {
  const unifyWritable = providers.find((x: Provider) => x.provider === "unify")?.capabilities.write;
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40">
      <button onClick={onToggle} className="w-full text-left p-4 flex items-center gap-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-md font-bold text-sm shrink-0" style={{ background: tierColor[p.score.tier] + "22", color: tierColor[p.score.tier] }}>{p.score.tier}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{p.name}</span>
            {p.score.isChampion && <span className="text-[10px] px-1.5 py-0.5 rounded bg-fern/20 text-fernlight">★ CHAMPION</span>}
            <span className="text-xs text-neutral-500 truncate">{p.title} · {p.company.name}{p.company.isAiNative ? " · AI-native" : ""}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2 max-w-md">
            <Metric label="reach" v={p.score.reachScore} c="#3b82f6" />
            <Metric label="mission" v={p.score.missionScore} c="#16a34a" />
            <Metric label="email vol" v={p.score.emailVolumeScore} c="#a855f7" />
          </div>
        </div>
        <div className="text-2xl font-bold tabular-nums" style={{ color: tierColor[p.score.tier] }}>{p.score.total}</div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-neutral-800 pt-3 space-y-4 text-sm">
          <p className="text-neutral-300 italic">{p.score.rationale}</p>

          {p.personalization && (
            <div className="rounded-md bg-neutral-900 border border-neutral-800 p-3">
              <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Personalization brief — outreach-as-craft</div>
              {p.personalization.triggerEvent && <p className="text-xs text-amber-400 mb-1">⚡ {p.personalization.triggerEvent}</p>}
              <p className="text-neutral-200">{p.personalization.draftOpener}</p>
              <p className="text-xs text-neutral-500 mt-2">Value prop: {p.personalization.valueProp}</p>
              <p className="text-xs text-neutral-500">CTA: {p.personalization.cta}</p>
              {p.personalization.warmIntroPath && <p className="text-xs text-fernlight mt-1">🤝 {p.personalization.warmIntroPath}</p>}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Evidence ({p.score.evidence.length})</div>
              <ul className="space-y-1">
                {p.score.evidence.map((e: Evidence) => (
                  <li key={e.ruleId} className="flex items-center gap-2 text-xs">
                    <span className="w-12 text-right tabular-nums text-neutral-400">+{e.points}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: e.axis === "reach" ? "#1e3a8a55" : e.axis === "mission" ? "#14532d55" : "#581c8755" }}>{e.axis}</span>
                    <span className="text-neutral-300">{e.signal}:</span>
                    <span className="text-neutral-500 truncate">{e.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Channel & routes</div>
              <p className="text-xs"><b className="text-neutral-200">{p.channel.primary}</b>{p.channel.secondary ? ` → ${p.channel.secondary}` : ""}</p>
              <p className="text-xs text-neutral-500">{p.channel.timing} — {p.channel.reason}</p>
              <div className="mt-2 space-y-1">
                {p.contactRoutes.map((r: any, i: number) => (
                  <div key={i} className="text-xs flex items-center gap-2">
                    <span className="w-28 text-neutral-400">{r.channel}</span>
                    <span className="truncate text-neutral-300">{r.value}</span>
                    <span className={`ml-auto text-[10px] ${r.verified ? "text-fernlight" : "text-amber-500"}`}>{r.verified ? "verified" : `inferred ${(r.confidence * 100) | 0}%`}</span>
                  </div>
                ))}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-500 mt-3 mb-1">Provenance</div>
              <div className="text-[11px] text-neutral-500">{p.provenance.map((pr: any) => `${pr.field}←${pr.provider}`).join(" · ")}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button disabled={syncing} onClick={() => onSync(p.id, ["zero"])} className="text-xs px-3 py-1.5 rounded-md bg-fern hover:bg-fernlight text-white disabled:opacity-50">{syncing ? "syncing…" : "Sync to Zero (CRM)"}</button>
            <button disabled={syncing || !unifyWritable} title={unifyWritable ? "" : "Unify key is read-only"} onClick={() => onSync(p.id, ["zero", "unify"])} className="text-xs px-3 py-1.5 rounded-md border border-neutral-700 hover:bg-neutral-800 disabled:opacity-40">Sync to Zero + Unify</button>
            <span className="text-[11px] text-neutral-500 ml-1">→ creates an <b>outreach-ready</b> deal. No message is sent.</span>
            {synced && (
              <span className="ml-auto text-[11px] text-fernlight">
                {synced.ok ? "✓ synced" : "⚠ partial"} {synced.results?.map((r: any) => `${r.target}:${Object.values(r.ids || {}).length ? "ok" : "err"}`).join(" ")}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, v, c }: { label: string; v: number; c: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5"><span>{label}</span><span className="tabular-nums">{v}</span></div>
      <Bar value={v} color={c} />
    </div>
  );
}

function Inbound({ inbound }: { inbound: any }) {
  if (!inbound) return <div className="text-sm text-neutral-500">loading…</div>;
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-3">AI-search query map — what our ICP asks LLMs</div>
        <ul className="space-y-2">
          {inbound.queryMap.map((q: any, i: number) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${q.missionAligned ? "bg-fernlight" : "bg-neutral-600"}`} />
              <span className="text-neutral-200">“{q.query}”</span>
              <span className="ml-auto text-[10px] text-neutral-500">{q.intent}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-neutral-500 mt-3">Green = mission-aligned (taste / voice / anti-slop). Feed these into Scaile to win the AI answer.</p>
      </div>
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-3">Content briefs (paste into Scaile)</div>
        <ul className="space-y-3">
          {inbound.contentBriefs.map((b: any, i: number) => (
            <li key={i} className="text-sm">
              <div className="text-neutral-100 font-medium">{b.title}</div>
              <div className="text-xs text-neutral-500">{b.angle} · targets: “{b.targetQuery}”</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
