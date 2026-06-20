"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, Building2, Check, Database, Mail, Minus, Phone, Play, Plus,
  Radar, RefreshCw, Search, Send, ShieldCheck, Sparkles, UserRound, X, Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Stage = "leadgen" | "enrich" | "crm" | "sequence";
type StepEvent = { type: "stage"; stage: Stage; provider: "unify" | "zero" | "clay"; profileId: string; name: string; company: string; ok: boolean; recordId?: string; detail: string };
type PersonResult = {
  profileId: string; name: string; title: string; company: string; email: string; phone?: string;
  linkedinUrl: string; linkedinFollowers?: number; euResident: boolean;
  unifyPersonId?: string; zeroCompanyId?: string; zeroContactId?: string; zeroDealId?: string; sequenced: boolean; ok: boolean;
};
type WfStatus = { total: number; processed: number; remaining: number };
type PoolGroup = { company: { id: string; name: string; domain: string; latestFunding: string; employeeCount: number }; contacts: { profileId: string; name: string; title: string; email: string; phone?: string; linkedinFollowers?: number; euResident: boolean }[] };

const STAGES: { key: Stage; label: string; sub: string; provider: string; Icon: typeof Search }[] = [
  { key: "leadgen", label: "Lead-gen", sub: "ICP match · Unify", provider: "unify", Icon: Search },
  { key: "enrich", label: "Enrich", sub: "Clay + Unify", provider: "clay", Icon: Sparkles },
  { key: "crm", label: "Store", sub: "Zero CRM", provider: "zero", Icon: Database },
  { key: "sequence", label: "Sequence", sub: "Unify · gated", provider: "unify", Icon: Send },
];

const PROVIDER_COLOR: Record<string, string> = { unify: "#485f92", zero: "#8c6948", clay: "#3d6958" };

export function WorkflowView() {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(2);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<StepEvent[]>([]);
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [activeStage, setActiveStage] = useState<Stage | null>(null);
  const [doneStages, setDoneStages] = useState<Set<Stage>>(new Set());
  const [status, setStatus] = useState<WfStatus | null>(null);
  const [pool, setPool] = useState<PoolGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const refreshStatus = async () => {
    try {
      const r = await fetch("/api/workflow", { cache: "no-store" });
      if (!r.ok) throw new Error(`backend ${r.status}`);
      const j = await r.json();
      setStatus(j.status); setPool(j.pool ?? []); setError(null);
    } catch (e) { setError("Backend not connected — start the Stage 1 server on :3000."); }
  };

  useEffect(() => { refreshStatus(); return () => esRef.current?.close(); }, []);

  const start = () => {
    setRunning(true); setSteps([]); setPeople([]); setError(null);
    setActiveStage(null); setDoneStages(new Set());
    const es = new EventSource(`/api/workflow/stream?count=${count}`);
    esRef.current = es;
    es.addEventListener("stage", (ev) => {
      const d = JSON.parse((ev as MessageEvent).data) as StepEvent;
      setActiveStage(d.stage);
      setDoneStages((prev) => { const n = new Set(prev); n.add(d.stage); return n; });
      setSteps((c) => [d, ...c].slice(0, 60));
    });
    es.addEventListener("person.done", (ev) => {
      const d = JSON.parse((ev as MessageEvent).data) as { result: PersonResult };
      setPeople((c) => [...c, d.result]);
    });
    es.addEventListener("workflow.completed", (ev) => {
      const d = JSON.parse((ev as MessageEvent).data) as WfStatus & { processed: number };
      setStatus({ total: d.total, processed: d.total - d.remaining, remaining: d.remaining });
      setRunning(false); setActiveStage(null); es.close(); refreshStatus();
    });
    es.addEventListener("workflow.error", (ev) => {
      setError(JSON.parse((ev as MessageEvent).data)?.message ?? "Workflow error"); setRunning(false); es.close();
    });
    es.onerror = () => { setError((p) => p ?? "Live stream disconnected."); setRunning(false); es.close(); };
  };

  const remaining = status?.remaining ?? 0;
  const maxCount = Math.max(1, Math.min(remaining || 15, 15));
  const clamped = Math.min(count, maxCount);

  return (
    <main className="standard-page">
      <section className="page-heading">
        <div className="eyebrow">GTM WORKFLOW / <span>LIVE PROVIDER ACTIVITY</span></div>
        <h1>ICP → Enrich → CRM → Sequence.</h1>
        <p>One click runs the real pipeline: ICP leads enriched through Clay + Unify, stored in Zero CRM, then enrolled in a Unify sequence — queued for human approval. No messages are sent automatically.</p>
      </section>

      <section className="wf-control">
        <div className="wf-counter">
          <span>People to enrich</span>
          <div className="wf-stepper">
            <button className="icon-button" aria-label="Fewer" disabled={running || clamped <= 1} onClick={() => setCount((c) => Math.max(1, c - 1))}><Minus size={15} /></button>
            <strong>{clamped}</strong>
            <button className="icon-button" aria-label="More" disabled={running || clamped >= maxCount} onClick={() => setCount((c) => Math.min(maxCount, c + 1))}><Plus size={15} /></button>
          </div>
        </div>
        <div className="wf-status">
          {status ? <><b>{status.processed}</b> / {status.total} enriched · <b>{status.remaining}</b> remaining in ICP pool</> : <span className="wf-dim">Loading pool…</span>}
        </div>
        <div className="wf-actions">
          <button className="button ghost compact" onClick={refreshStatus} disabled={running}><RefreshCw size={14} /> Refresh</button>
          <button className="button dark large" onClick={start} disabled={running || remaining === 0 || !!(error && !status)}>
            {running ? <><Radar size={17} /> Running…</> : remaining === 0 ? <>Pool complete</> : <><Play size={16} fill="currentColor" /> Start workflow</>}
          </button>
        </div>
      </section>

      {error && (
        <section className="wf-error" role="alert">
          <X size={15} /><span>{error}</span>
          <button className="button ghost compact" onClick={refreshStatus}><RefreshCw size={13} /> Retry</button>
        </section>
      )}

      <section className="wf-stages">
        {STAGES.map((s, i) => {
          const isActive = activeStage === s.key;
          const isDone = doneStages.has(s.key) && !isActive;
          return (
            <div key={s.key} className={`wf-stage ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
              <i style={{ background: PROVIDER_COLOR[s.provider] }}><s.Icon size={16} /></i>
              <div><strong>{s.label}</strong><small>{s.sub}</small></div>
              <motion.b className="wf-stage-dot" animate={isActive && !reduced ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ repeat: Infinity, duration: 1.1 }} />
              {i < STAGES.length - 1 && <ArrowRight className="wf-stage-arrow" size={16} />}
            </div>
          );
        })}
      </section>

      <section className="wf-grid">
        <div className="wf-results">
          <div className="panel-head"><div><span className="live-dot" /><h2>Enriched & synced</h2><small>{people.length ? `${people.length} this run` : "Results appear as each person completes"}</small></div></div>
          {people.length === 0 && !running && <div className="activity-empty"><UserRound size={22} /><span>Set a count and start the workflow.</span></div>}
          <div className="wf-people">
            <AnimatePresence>
              {people.map((p) => (
                <motion.article key={p.profileId} className="wf-person" initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="wf-person-top">
                    <i className="avatar">{p.name.split(" ").map((n) => n[0]).join("")}</i>
                    <div><strong>{p.name}</strong><small>{p.title} · {p.company}</small></div>
                    <span className={`wf-badge ${p.ok ? "ok" : "warn"}`}>{p.ok ? <><Check size={12} /> Synced</> : "Partial"}</span>
                  </div>
                  <div className="wf-person-fields">
                    <span><Mail size={12} /> {p.email}</span>
                    {p.phone && <span><Phone size={12} /> {p.phone}</span>}
                    {p.linkedinFollowers != null && <span><UserRound size={12} /> {p.linkedinFollowers.toLocaleString()} followers</span>}
                    {p.euResident && <span className="wf-eu"><ShieldCheck size={12} /> EU resident</span>}
                  </div>
                  <div className="wf-person-ids">
                    <em style={{ "--c": PROVIDER_COLOR.unify } as React.CSSProperties}>Unify {p.unifyPersonId ? p.unifyPersonId.slice(0, 8) : "—"}</em>
                    <em style={{ "--c": PROVIDER_COLOR.zero } as React.CSSProperties}>Zero contact {p.zeroContactId ? p.zeroContactId.slice(0, 8) : "—"}</em>
                    <em style={{ "--c": PROVIDER_COLOR.zero } as React.CSSProperties}>Zero deal {p.zeroDealId ? p.zeroDealId.slice(0, 8) : "—"}</em>
                    <em style={{ "--c": PROVIDER_COLOR.unify } as React.CSSProperties}>{p.sequenced ? "Sequenced · gated" : "Not sequenced"}</em>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <aside className="wf-activity">
          <div className="panel-head"><div><span className="live-dot" /><h2>Live activity</h2><small>{running ? "Streaming real provider operations" : "Real provider operations"}</small></div></div>
          <div className="activity-list" aria-live="polite">
            {steps.length === 0 && <div className="activity-empty"><Zap size={20} /><span>Each step is a real Unify / Zero / Clay call.</span></div>}
            {steps.map((s, i) => (
              <div className="activity-row" key={`${s.profileId}-${s.stage}-${i}`}>
                <i className="provider-mark" style={{ background: PROVIDER_COLOR[s.provider], color: "#fff" }}>{s.provider[0].toUpperCase()}</i>
                <span className="activity-message">{s.name}: {s.detail}</span>
                <span className="event-type">{s.stage}</span>
                {s.ok ? <Check size={13} /> : <X size={13} />}
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="wf-pool">
        <div className="section-title"><h3>ICP pool</h3><span>{pool.reduce((n, g) => n + g.contacts.length, 0)} LEADS · {pool.length} COMPANIES</span></div>
        <div className="wf-pool-grid">
          {pool.map((g) => (
            <article className="wf-pool-co" key={g.company.id}>
              <header><Building2 size={14} /><strong>{g.company.name}</strong><small>{g.company.latestFunding}</small></header>
              {g.contacts.map((c) => <div className="wf-pool-row" key={c.profileId}><b>{c.name}</b><span>{c.title}</span></div>)}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
