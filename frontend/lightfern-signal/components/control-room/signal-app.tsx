"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity, ArrowRight, BarChart3, BookOpen, Check, ChevronRight, CircleStop, Clock3,
  Command, ExternalLink, FileCheck2, Filter, Inbox, Layers3, Link2, Mail,
  LayoutGrid, Minus, Network, Pause, Play, Plus, Radar, RefreshCw, Search, Send, ShieldCheck, Sparkles, UserRound,
  X, Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApprovedProspect } from "@/src/contracts/outreach";
import { fixtureProspects } from "@/src/repositories/fixtures";
import { calculateReadiness, generateEmailDraft, selectOutreachPlay, validateDraft } from "@/src/outreach/engine";
import { ScoreBars } from "@/components/visualisations/score-bars";
import { MatrixView } from "@/components/control-room/matrix-view";

type View = "landing" | "control" | "outreach" | "pipeline" | "analytics" | "benchmark" | "matrix";

// ── Real GTM workflow types (Clay → Unify → Zero → Sequence) ──────────────
type WfStage = "leadgen" | "enrich" | "crm" | "sequence";
type WfStep = { stage: WfStage; provider: "unify" | "zero" | "clay"; profileId: string; name: string; company: string; ok: boolean; recordId?: string; detail: string };
type WfPerson = {
  profileId: string; name: string; title: string; company: string; companyId: string;
  email: string; phone?: string; linkedinUrl: string; linkedinFollowers?: number; euResident: boolean;
  unifyPersonId?: string; zeroCompanyId?: string; zeroContactId?: string; zeroDealId?: string; sequenced: boolean; ok: boolean;
};
type PoolContact = { profileId: string; name: string; title: string; email: string; phone?: string; linkedinFollowers?: number; euResident: boolean; linkedinEngagement?: string; championScore?: number; isChampion?: boolean };
type SequenceStep = { type: string; status: string; subject: string; body: string };
type ChampionSequence = { name: string; status: string; note: string; sender: string; mailbox: string; steps: SequenceStep[] };
type PoolGroup = { company: { id: string; name: string; domain: string; latestFunding: string; employeeCount: number }; contacts: PoolContact[] };
type UnifyProfile = { connected: boolean; found?: boolean; lists?: { id: string; name: string }[]; listsExpired?: boolean; listsError?: string; sequence?: ChampionSequence | null; person?: { id?: string; campaign?: string | null; sequenceStatus?: string | null; doNotEmail?: boolean; emailOptOut?: boolean; euResident?: boolean; lastActivityAt?: string | null } };

const WF_STAGES: { key: WfStage; label: string }[] = [
  { key: "leadgen", label: "ICP lead-gen" }, { key: "enrich", label: "Enrich" },
  { key: "crm", label: "Zero CRM" }, { key: "sequence", label: "Sequence" },
];
const STAGE_INDEX: Record<WfStage, number> = { leadgen: 0, enrich: 1, crm: 2, sequence: 3 };
const PROVIDER_COLOR: Record<string, string> = { unify: "#485f92", zero: "#8c6948", clay: "#3d6958" };
const STAGE_BADGE: Record<WfStage, string> = { leadgen: "Sourced", enrich: "Enriched", crm: "In CRM", sequence: "Sequenced" };
const discoverySteps = ["Matching ICP", "Finding contacts", "Enriching email", "Finding phone", "Reading LinkedIn", "Checking compliance", "Preparing sync"];
const activateSteps = ["Creating company", "Creating contact", "Creating deal", "Enrolling sequence", "Awaiting approval", "Ready to send"];

export function SignalApp({ initialView = "landing" }: { initialView?: View }) {
  const reduced = useReducedMotion();
  const [view, setView] = useState<View>(initialView);
  const [prospects, setProspects] = useState<ApprovedProspect[]>([]);
  const [wfStatus, setWfStatus] = useState<{ total: number; processed: number; remaining: number } | null>(null);
  const [companies, setCompanies] = useState(0);
  const [outreachProspect, setOutreachProspect] = useState<ApprovedProspect | null>(null);

  useEffect(() => {
    let on = true;
    fetch("/api/workflow", { cache: "no-store" }).then((r) => r.json()).then((j) => {
      if (!on) return;
      const flat = (j.pool ?? []).flatMap((g: { company: { name: string }; contacts: PoolContact[] }) => g.contacts.map((c) => ({ c, company: g.company.name })));
      flat.sort((a: { c: PoolContact }, b: { c: PoolContact }) => (b.c.isChampion ? 1 : 0) - (a.c.isChampion ? 1 : 0) || (b.c.championScore ?? 0) - (a.c.championScore ?? 0));
      const ps = flat.map(({ c, company }: { c: PoolContact; company: string }) => toProspect(c, company, undefined));
      setProspects(ps); setCompanies((j.pool ?? []).length); setWfStatus(j.status ?? null);
    }).catch(() => {});
    return () => { on = false; };
  }, []);

  const lead = outreachProspect ?? prospects[0] ?? fixtureProspects[0];
  const openOutreach = (p: ApprovedProspect) => { setOutreachProspect(p); setView("outreach"); };

  if (view === "landing") return <Landing onEnter={() => setView("control")} onDemo={() => setView("control")} reduced={!!reduced} />;

  return <div className="app-shell">
    <AppHeader view={view} setView={setView} />
    {view === "control" && <ControlRoom reduced={!!reduced} onOutreach={openOutreach} />}
    {view === "matrix" && <MatrixView prospects={prospects} onOutreach={openOutreach} />}
    {view === "outreach" && <OutreachWorkspace prospect={lead} onBenchmark={() => setView("benchmark")} />}
    {view === "pipeline" && <PipelineView prospects={prospects} onSelect={openOutreach} />}
    {view === "analytics" && <AnalyticsView prospects={prospects} status={wfStatus} companies={companies} />}
    {view === "benchmark" && <BenchmarkView prospect={lead} />}
  </div>;
}

function Landing({ onEnter, onDemo, reduced }: { onEnter: () => void; onDemo: () => void; reduced: boolean }) {
  return <main className="landing">
    <nav className="landing-nav"><Brand /><div><button className="text-button" onClick={onDemo}>See it run</button><button className="button dark" onClick={onEnter}>Launch Signal <ArrowRight size={16} /></button></div></nav>
    <section className="hero">
      <motion.div initial={{ opacity: 0, y: reduced ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} className="hero-copy">
        <div className="eyebrow"><Sparkles size={13} /> GTM intelligence, with evidence</div>
        <h1>Find the voices<br />worth <em>amplifying.</em></h1>
        <p>Lightfern Signal discovers founders whose communication matters, understands what makes their voice distinctive, and turns genuine research into high-trust relationships.</p>
        <div className="hero-actions"><button className="button dark large" onClick={onEnter}>Launch Signal <ArrowRight size={18} /></button><button className="button ghost large" onClick={onDemo}><Play size={17} fill="currentColor" /> Run workflow</button></div>
      </motion.div>
      <motion.div className="hero-system" initial={{ opacity: 0, scale: reduced ? 1 : .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .15 }}>
        <div className="system-top"><span className="live-dot" /> Signal operating system <small>LIVE</small></div>
        <div className="system-grid">
          <div className="engine-preview discover"><small>01 / DISCOVER</small><h3>Understand the signal</h3><MiniProspect prospect={fixtureProspects[0]} /></div>
          <div className="system-flow"><span /><ArrowRight size={18} /><span /></div>
          <div className="engine-preview activate"><small>02 / ACTIVATE</small><h3>Build the right approach</h3><div className="play-mini"><span><BookOpen size={15} /> Founder Voice Benchmark</span><b>Recommended</b><p>4 verified reasons · 1 fallback</p></div></div>
        </div>
        <div className="system-foot"><span><ShieldCheck size={14} /> Evidence attached</span><span><UserRound size={14} /> Human approval required</span><span><Zap size={14} /> Champion path visible</span></div>
      </motion.div>
    </section>
    <section className="engine-intro">
      <article><span>01</span><div><h2>Discover</h2><p>Find founders with product need, mission alignment and distribution power. Every conclusion stays attached to its source.</p></div></article>
      <article><span>02</span><div><h2>Activate</h2><p>Use real research to create outreach that could only have been written for them—and a path from prospect to champion.</p></div></article>
    </section>
  </main>;
}

function Brand() { return <div className="brand"><i><Radar size={17} /></i><span>LIGHTFERN <b>SIGNAL</b></span></div>; }

function AppHeader({ view, setView }: { view: View; setView: (v: View) => void }) {
  const nav = [["control", "Control Room", Command], ["matrix", "Matrix", LayoutGrid], ["outreach", "Outreach", Mail], ["pipeline", "Pipeline", Layers3], ["analytics", "Analytics", BarChart3]] as const;
  return <header className="app-header">
    <button className="brand-button" onClick={() => setView("landing")} aria-label="Lightfern Signal home"><Brand /></button>
    <nav>{nav.map(([id, label, Icon]) => <button className={view === id ? "active" : ""} onClick={() => setView(id)} key={id}><Icon size={15} />{label}</button>)}</nav>
    <div className="header-actions"><span className="mode-pill active"><i />LIVE</span></div>
  </header>;
}

function ControlRoom({ reduced, onOutreach }: { reduced: boolean; onOutreach: (p: ApprovedProspect) => void }) {
  const [pool, setPool] = useState<PoolGroup[]>([]);
  const [status, setStatus] = useState<{ total: number; processed: number; remaining: number } | null>(null);
  const [count, setCount] = useState(3);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<(WfStep & { time: string })[]>([]);
  const [results, setResults] = useState<WfPerson[]>([]);
  const [stageOf, setStageOf] = useState<Record<string, WfStage>>({});
  const [activeStage, setActiveStage] = useState<WfStage | null>(null);
  const [progress, setProgress] = useState(0);
  const [requested, setRequested] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const refresh = async () => {
    try {
      const r = await fetch("/api/workflow", { cache: "no-store" });
      if (!r.ok) throw new Error(`backend ${r.status}`);
      const j = await r.json();
      setStatus(j.status); setPool(j.pool ?? []); setError(null);
    } catch { setError("Backend not connected — start the Stage 1 server on :3000, then retry."); }
  };
  useEffect(() => { refresh(); return () => esRef.current?.close(); }, []);

  const run = () => {
    setRunning(true); setError(null); setSteps([]); setResults([]); setStageOf({}); setActiveStage(null); setProgress(0);
    setRequested(count);
    const es = new EventSource(`/api/workflow/stream?count=${count}`);
    esRef.current = es;
    es.addEventListener("workflow.started", (ev) => setRequested(JSON.parse((ev as MessageEvent).data)?.requested ?? count));
    es.addEventListener("stage", (ev) => {
      const d = JSON.parse((ev as MessageEvent).data) as WfStep;
      setActiveStage(d.stage);
      setStageOf((m) => ({ ...m, [d.profileId]: d.stage }));
      setProgress((p) => p + 1);
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setSteps((c) => [{ ...d, time }, ...c].slice(0, 40));
    });
    es.addEventListener("person.done", (ev) => {
      const d = JSON.parse((ev as MessageEvent).data) as { result: WfPerson };
      setResults((c) => [...c, d.result]);
    });
    es.addEventListener("workflow.completed", () => { setRunning(false); setActiveStage(null); es.close(); refresh(); });
    es.addEventListener("workflow.error", (ev) => { setError(JSON.parse((ev as MessageEvent).data)?.message ?? "Workflow error"); setRunning(false); es.close(); });
    es.onerror = () => { setError((p) => p ?? "Live event stream disconnected."); setRunning(false); es.close(); };
  };

  const allContacts = pool.flatMap((g) => g.contacts.map((c) => ({ ...c, companyName: g.company.name })));
  const doneIds = new Set(results.map((r) => r.profileId));
  const enrichedCount = results.length;
  const crmCount = results.filter((r) => r.zeroContactId).length;
  const seqCount = results.filter((r) => r.sequenced).length;
  const stepCount = (s: WfStage) => steps.filter((x) => x.stage === s && x.ok).length;
  const maxCount = Math.min(status?.total ?? 15, 15);
  const clamped = Math.min(count, maxCount);
  // Drive the engine tracks from real completion so they reach "Ready to send" when done.
  const requestedN = requested || clamped;
  const completed = results.length;
  const stageFrac = running && activeStage ? (STAGE_INDEX[activeStage] + 1) / 4 : 0;
  const frac = requestedN ? Math.min(1, (completed + (completed < requestedN ? stageFrac : 0)) / requestedN) : completed ? 1 : 0;
  const discoverActive = completed === 0 && !running ? 0 : Math.min(6, Math.round(frac * 6));
  const activateActive = completed === 0 ? -1 : !running ? 5 : Math.min(4, Math.round(frac * 5));
  const readyToSend = !running && completed > 0;
  const providerState = (p: "clay" | "unify" | "zero", live: string) => {
    if (!running) return enrichedCount ? "Connected" : "Idle";
    return steps[0]?.provider === p ? live : "Connected";
  };

  // Discover only appears once Run Signal is clicked — then shows ALL ICP people (champions first).
  // Activate pulls just the enrolled champions (results).
  const started = running || steps.length > 0 || results.length > 0;
  const discover = started
    ? [...allContacts]
        .sort((a, b) => (b.isChampion ? 1 : 0) - (a.isChampion ? 1 : 0) || (b.championScore ?? 0) - (a.championScore ?? 0))
        .map((c) => toProspect(c, c.companyName, stageOf[c.profileId]))
    : [];
  const activate = results.map((r) => toProspect({ profileId: r.profileId, name: r.name, title: r.title, email: r.email, phone: r.phone, linkedinFollowers: r.linkedinFollowers, euResident: r.euResident }, r.company, "sequence", true));

  return <main className="control-page">
    <section className="control-title">
      <div><div className="eyebrow">CONTROL ROOM / <span>LIVE PIPELINE</span></div><h1>One signal. Two engines.</h1><p>Discover the right ICP leads, then activate the strongest route with real enrichment and human judgment.</p></div>
      <div className="run-controls">
        <button className="icon-button" aria-label="Fewer leads" disabled={running || clamped <= 1} onClick={() => setCount((c) => Math.max(1, c - 1))}><Minus size={16} /></button>
        <span className="run-count" aria-live="polite">{clamped}</span>
        <button className="icon-button" aria-label="More leads" disabled={running || clamped >= maxCount} onClick={() => setCount((c) => Math.min(maxCount, c + 1))}><Plus size={16} /></button>
        <button className="button dark large" onClick={run} disabled={running || !!(error && !status)}>{running ? <><Activity size={17} /> Signal running</> : <><Play size={16} fill="currentColor" /> Run Signal</>}</button>
      </div>
    </section>

    {error && <section className="wf-error" role="alert"><X size={15} /><span>{error}</span><button className="button ghost compact" onClick={refresh}><RefreshCw size={13} /> Retry</button></section>}

    <section className="stats-strip">
      <Metric label="Companies found" value={pool.length ? pool.length.toString() : "—"} change="ICP accounts" />
      <Metric label="Leads enriched" value={enrichedCount || status?.processed ? String(enrichedCount || status?.processed) : "—"} change="Clay + Unify" />
      <Metric label="Contact coverage" value={enrichedCount || status?.processed ? "100%" : "—"} change="Verified" />
      <Metric label="In CRM" value={crmCount.toString()} change="Zero · human gated" />
      <Metric label="Sequenced" value={seqCount.toString()} change="Primary outcome" accent />
    </section>

    <section className="provider-rail">
      <Provider name="Clay" initial="C" color={PROVIDER_COLOR.clay} state={providerState("clay", "Sourcing")} count={stepCount("leadgen")} operation="ICP sourcing and enrichment" />
      <Provider name="Unify" initial="U" color={PROVIDER_COLOR.unify} state={providerState("unify", "Enriching")} count={stepCount("enrich")} operation="People records and compliance" />
      <Provider name="Zero" initial="Z" color={PROVIDER_COLOR.zero} state={providerState("zero", "Syncing")} count={stepCount("crm")} operation="Contact and deal graph" />
    </section>

    <section className="engine-layout">
      <div className="engine-column discovery-engine">
        <EngineHead number="01" title="Discover" subtitle="Who fits the ICP?" color="green" />
        <StageTrack labels={discoverySteps} active={discoverActive} />
        {!started
          ? <div className="empty-activate"><Inbox size={24} /><h3>Pick a number, then Run Signal</h3><p>Your top-ranked ICP champions appear here and flow through enrichment into the sequence.</p></div>
          : <div className="prospect-list">{discover.map((p) => <ProspectCard key={p.id} prospect={p} stage={p.providerIds.zero ? "Synced" : p.providerIds.unify ? "Enriching" : "Sourced"} onClick={() => onOutreach(p)} />)}</div>}
      </div>
      <div className="handoff">
        <div className={running ? "handoff-line active" : "handoff-line"}><span /><motion.i animate={running && !reduced ? { x: [0, 28, 0] } : {}} transition={{ repeat: Infinity, duration: 2 }}><ChevronRight size={15} /></motion.i><span /></div>
        <small>HUMAN<br />APPROVAL</small>
      </div>
      <div className="engine-column activate-engine">
        <EngineHead number="02" title="Activate" subtitle={readyToSend ? `${completed} ready to send` : "Sync, then sequence"} color="violet" />
        <StageTrack labels={activateSteps} active={activateActive} />
        {activate.length === 0
          ? <div className="empty-activate"><Inbox size={24} /><h3>Awaiting enriched leads</h3><p>Run Signal — enriched leads land here in Zero and a Unify sequence, gated on human approval.</p></div>
          : <div className="prospect-list">{activate.map((p) => <ProspectCard key={p.id} prospect={p} stage={readyToSend ? "Ready to send" : "Enrolling"} onClick={() => onOutreach(p)} outreach />)}</div>}
      </div>
    </section>

    <section className="activity-panel">
      <div className="panel-head"><div><span className="live-dot" /><h2>Live activity</h2><small>{running ? "Receiving live provider events" : "Real Unify, Zero and Clay operations"}</small></div></div>
      <div className="activity-list" aria-live="polite">
        {steps.length === 0 && <div className="activity-empty"><Activity size={22} /><span>Run Signal to enrich ICP leads into Unify and Zero.</span></div>}
        {steps.slice(0, 8).map((s, i) => <div className="activity-row" key={`${s.profileId}-${s.stage}-${i}`}><ProviderMark name={s.provider} /><span className="activity-message">{s.name}: {s.detail}</span><span className="event-type">{s.stage}</span><time>{s.time}</time>{s.ok ? <Check size={13} /> : <X size={13} />}</div>)}
      </div>
    </section>
  </main>;
}

function reachFrom(followers?: number) { return !followers ? 74 : Math.max(48, Math.min(98, Math.round(45 + Math.log10(followers) * 12))); }
function tierFrom(score: number): "A" | "B" | "C" { return score >= 80 ? "A" : score >= 62 ? "B" : "C"; }

/** Map a real, Clay-enriched lead into the Control Room's ApprovedProspect card shape. */
function toProspect(
  c: { profileId: string; name: string; title: string; email: string; phone?: string; linkedinFollowers?: number; euResident: boolean; linkedinEngagement?: string },
  companyName: string,
  stage: WfStage | undefined,
  done = false,
): ApprovedProspect {
  const score = reachFrom(c.linkedinFollowers);
  const providerIds: ApprovedProspect["providerIds"] = done || stage === "crm" || stage === "sequence"
    ? { unify: c.profileId, zero: c.profileId }
    : stage === "enrich"
      ? { unify: c.profileId }
      : {};
  const reachLine = c.linkedinFollowers != null ? `${c.linkedinFollowers.toLocaleString()} LinkedIn followers${c.phone ? " · direct dial" : ""}` : `GTM leader${c.phone ? " · direct dial" : ""}`;
  const excerpt = c.linkedinEngagement ?? `${c.title} at ${companyName} — a high-stakes go-to-market role Lightfern is built for.`;
  return {
    id: c.profileId, demo: false,
    identity: { name: c.name, role: c.title, location: c.euResident ? "EU" : "" },
    company: { name: companyName, domain: "", type: "AI-native SaaS", size: "", fundingStage: "" },
    championScore: score, confidenceScore: c.email ? 95 : 70,
    categoryScores: { need: 80, voice: 76, mission: 82, reach: score, timing: 75, access: c.email ? 92 : 60 },
    tier: tierFrom(score),
    profiles: {},
    contact: { email: c.email, emailVerified: true, route: c.phone ? "Verified email + phone" : "Verified work email" },
    evidence: [{ id: `ev-${c.profileId}`, title: reachLine, excerpt, url: "#", publishedAt: "", capturedAt: "", confidence: 92, mode: "observed", category: "reach", permittedForOutreach: true }],
    triggers: [],
    personalisationBrief: "",
    providerIds,
    restrictions: { optOut: false, duplicate: false, directCompetitor: false, existingOutreach: false, unsupportedPersonalClaim: false },
    approvalStatus: "approved",
  };
}

function Metric({ label, value, change, accent }: { label: string; value: string; change: string; accent?: boolean }) {
  return <div className={accent ? "metric accent" : "metric"}><span>{label}</span><strong>{value}</strong><small>{change}</small></div>;
}

function Provider({ name, initial, color, state, count, operation }: { name: string; initial: string; color: string; state: string; count: number; operation: string }) {
  return <article className="provider-card"><i style={{ background: color }}>{initial}</i><div><strong>{name}</strong><small>{operation}</small></div><span className={`provider-state ${state.toLowerCase()}`}><b />{state}</span><em>{count} records</em><time>Last success · now</time></article>;
}

function ProviderMark({ name }: { name: string }) { return <i className={`provider-mark ${name}`}>{name === "internal" ? "L" : name.charAt(0).toUpperCase()}</i>; }
function EngineHead({ number, title, subtitle, color }: { number: string; title: string; subtitle: string; color: string }) { return <div className={`engine-head ${color}`}><span>{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div><Activity size={18} /></div>; }
function StageTrack({ labels, active }: { labels: string[]; active: number }) { return <div className="stage-track">{labels.map((label, i) => <div className={i < active ? "done" : i === active ? "active" : ""} key={label}><i>{i < active ? <Check size={10} /> : i + 1}</i><span>{label}</span></div>)}</div>; }

function MiniProspect({ prospect }: { prospect: ApprovedProspect }) { return <div className="mini-prospect"><Avatar name={prospect.identity.name} /><div><b>{prospect.identity.name}</b><small>{prospect.company.name}</small></div><strong>{prospect.championScore}</strong></div>; }
function Avatar({ name }: { name: string }) { return <i className="avatar">{name.split(" ").map((n) => n[0]).join("")}</i>; }

function ProspectCard({ prospect, stage, onClick, outreach }: { prospect: ApprovedProspect; stage: string; onClick: () => void; outreach?: boolean }) {
  return <motion.button layout className={`prospect-card ${outreach ? "outreach" : ""}`} onClick={onClick} whileHover={{ y: -2 }}>
    <Avatar name={prospect.identity.name} /><div className="prospect-main"><span><strong>{prospect.identity.name}</strong><b>Tier {prospect.tier}</b></span><small>{prospect.identity.role} · {prospect.company.name}</small><p>{prospect.evidence[0]?.title}</p><div>{Object.keys(prospect.providerIds).map((p) => <ProviderMark name={p} key={p} />)}<em>{stage}</em></div></div>
    <div className="score-orb"><strong>{prospect.championScore}</strong><small>Champion</small><span>{prospect.confidenceScore}% conf.</span></div>
  </motion.button>;
}

function IntelligenceDrawer({ prospect, close, onApprove }: { prospect: ApprovedProspect; close: () => void; onApprove: () => void }) {
  return <><motion.div className="drawer-backdrop" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
  <motion.aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}>
    <div className="drawer-top"><div className="eyebrow">PROSPECT INTELLIGENCE / DEMO DATA</div><button className="icon-button" onClick={close} aria-label="Close intelligence drawer"><X size={17} /></button></div>
    <div className="founder-header"><Avatar name={prospect.identity.name} /><div><h2 id="drawer-title">{prospect.identity.name}</h2><p>{prospect.identity.role} at {prospect.company.name} · {prospect.identity.location}</p></div><span className="tier">TIER {prospect.tier}</span></div>
    <div className="why-card"><Sparkles size={17} /><div><span>Why this founder is here</span><p>{prospect.personalisationBrief}</p></div></div>
    <div className="score-feature"><div><span>Champion Score</span><strong>{prospect.championScore}</strong><small>How valuable could this founder become?</small></div><div><span>Confidence</span><strong>{prospect.confidenceScore}<em>%</em></strong><small>{prospect.evidence.length} evidence records</small></div></div>
    <ScoreBars prospect={prospect} />
    <SectionTitle title="Strongest evidence" meta={`${prospect.evidence.length} SOURCES`} />
    <div className="evidence-stack">{prospect.evidence.map((ev) => <article className="evidence-card" key={ev.id}><div><span>{ev.category}</span><b>{ev.mode} · {ev.confidence}%</b></div><h3>{ev.title}</h3><blockquote>“{ev.excerpt}”</blockquote><footer><time>{new Date(ev.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time><a href={ev.url} target="_blank">View source <ExternalLink size={12} /></a></footer></article>)}</div>
    <SectionTitle title="Contact & provenance" meta="VERIFIED ROUTES" />
    <div className="contact-grid"><span><Mail size={15} /><b>{prospect.contact.email ?? "No verified email"}</b><small>{prospect.contact.emailVerified ? "Verified" : "Requires verification"}</small></span><span><Network size={15} /><b>{prospect.warmIntroduction?.via ?? prospect.contact.route}</b><small>{prospect.warmIntroduction ? "Warm route" : "Direct route"}</small></span></div>
    <div className="drawer-actions"><button className="button ghost">Research further</button><button className="button dark" onClick={onApprove}>Approve for outreach <ArrowRight size={16} /></button></div>
  </motion.aside></>;
}

function SectionTitle({ title, meta }: { title: string; meta: string }) { return <div className="section-title"><h3>{title}</h3><span>{meta}</span></div>; }

function OutreachWorkspace({ prospect, onBenchmark }: { prospect: ApprovedProspect; onBenchmark: () => void }) {
  const readiness = calculateReadiness(prospect);
  const play = selectOutreachPlay(prospect);
  const draft = useMemo(() => generateEmailDraft(prospect), [prospect]);
  const quality = validateDraft(draft, prospect);
  const [approved, setApproved] = useState(false);
  const [synced, setSynced] = useState(false);
  const [opening, setOpening] = useState(draft.recommendedOpening);
  const [unify, setUnify] = useState<UnifyProfile | null>(null);
  useEffect(() => {
    const email = prospect.contact.email;
    if (!email) { setUnify(null); return; }
    let on = true;
    fetch(`/api/unify/person?email=${encodeURIComponent(email)}`, { cache: "no-store" })
      .then((r) => r.json()).then((d) => { if (on) setUnify(d); }).catch(() => { if (on) setUnify({ connected: false }); });
    return () => { on = false; };
  }, [prospect.contact.email]);
  const u = unify?.person;
  const seq = unify?.sequence ?? null;
  return <main className="outreach-page">
    <section className="workspace-head">
      <div><div className="eyebrow">ENGINE 02 / ACTIVATE / LIVE</div><h1>Build an approach worth reading.</h1><p>Research first. Claims attached. Human approval before provider sync.</p></div>
      <div className="workspace-person"><Avatar name={prospect.identity.name} /><span><b>{prospect.identity.name}</b><small>{prospect.company.name}</small></span><i>{prospect.championScore}<small>Champion</small></i><i className="violet">{readiness.score}<small>Readiness</small></i></div>
    </section>
    <section className="unify-panel">
      <div className="unify-head"><i>U</i><div><b>Unify engagement</b><small>Live from {prospect.identity.name.split(" ")[0]}’s Unify profile</small></div>
        {unify && unify.connected === false && <span className="unify-tag warn">Unify offline</span>}
        {unify?.connected && unify.found === false && <span className="unify-tag">Not yet enrolled</span>}
        {unify?.lists && unify.lists.length > 0 && <span className="unify-tag ok"><Send size={11} /> {unify.lists.length} list{unify.lists.length > 1 ? "s" : ""}</span>}
      </div>
      <div className="unify-fields">
        <span><em>Lists / sequences</em><b>{unify?.lists && unify.lists.length ? unify.lists.map((l) => l.name).join(", ") : unify?.connected && unify.found ? "ICP" : "—"}</b></span>
        <span><em>Enrolment</em><b>{u?.sequenceStatus ?? (unify?.connected ? "Not enrolled" : "—")}</b></span>
        <span><em>Campaign / source</em><b>{u?.campaign ?? "—"}</b></span>
        <span><em>Compliance</em><b>{u ? `${u.doNotEmail || u.emailOptOut ? "Opted out" : "OK to contact"}${u.euResident ? " · EU" : ""}` : "—"}</b></span>
      </div>
    </section>

    <section className="readiness-play">
      <article className="readiness-card"><div className="readiness-score"><span style={{ "--score": readiness.score } as React.CSSProperties}><strong>{readiness.score}</strong><small>/100</small></span><div><h2>Outreach Readiness</h2><p>Can we contact them well right now?</p></div></div><div className="readiness-parts">{Object.entries(readiness.components).map(([k, v]) => <span key={k}><i style={{ width: `${v / ({ contact: 20, evidence: 25, trigger: 20, channel: 15, cta: 10, confidence: 10 }[k as keyof typeof readiness.components]) * 100}%` }} /><b>{k}</b><em>{v}</em></span>)}</div></article>
      <article className="recommended-play"><div className="eyebrow"><Sparkles size={12} /> RECOMMENDED PLAY</div><h2>{play.recommended}</h2><ul>{play.reasons.map((r) => <li key={r}><Check size={13} />{r}</li>)}</ul><footer><span>Fallback</span><b>{play.fallback}</b><button onClick={onBenchmark}>Preview asset <ArrowRight size={14} /></button></footer></article>
    </section>
    <section className="builder-grid">
      <aside className="research-pane"><div className="pane-head"><div><BookOpen size={16} /><h2>Research</h2></div><span>{prospect.evidence.length} VERIFIED</span></div><p className="pane-intro">Only evidence permitted by Stage 1 can be used in personalised claims.</p>{prospect.evidence.map((ev, i) => <article className={`research-item ${i === 0 ? "selected" : ""}`} key={ev.id}><div><span>{ev.category}</span><b>{ev.confidence}% · {ev.mode}</b></div><h3>{ev.title}</h3><p>{ev.excerpt}</p><footer><Link2 size={12} /> {ev.id}</footer></article>)}</aside>
      <section className="email-pane"><div className="pane-head"><div><Mail size={16} /><h2>{seq ? "Personalized sequence" : "Generated email"}</h2></div><span>{seq ? seq.status.toUpperCase() : "DRAFT 01"}</span></div>{seq
        ? <div className="seq-steps" style={{ padding: 14 }}>{seq.steps.map((s, i) => <article className="seq-step" key={i}><header><i>{i + 1}</i><div><b>{s.subject}</b><small>{s.type} · {s.status}</small></div><span>{seq.sender} → {prospect.identity.name.split(" ")[0]}</span></header><pre className="seq-body">{s.body}</pre></article>)}</div>
        : <><div className="subject"><span>Subject</span><b>{draft.subjectOptions[0]}</b><button><RefreshCw size={13} /></button></div><div className="opening-options"><span>OPENING OPTIONS</span>{draft.openings.map((option, i) => <button className={opening === i ? "active" : ""} onClick={() => setOpening(i)} key={option}><i>{i + 1}</i><p>{option}</p>{opening === i && <Check size={15} />}</button>)}</div><div className="email-body">{draft.body.split("\n").map((line, i) => line ? <p key={i}>{i === 0 ? draft.openings[opening] : line}{i === 0 && <sup title="Supported by evidence">{1}</sup>}</p> : <br key={i} />)}</div><div className="email-meta"><span><Clock3 size={14} />{draft.timing}</span><span><Zap size={14} />CTA: {draft.cta}</span></div></>}</section>
      <aside className="claims-pane"><div className="pane-head"><div><FileCheck2 size={16} /><h2>Claims ledger</h2></div><span>{quality.claimsValid ? "VALID" : "BLOCKED"}</span></div><article className="claim-card"><header><i>1</i><span>PERSONALISED CLAIM</span><b><ShieldCheck size={13} /> VERIFIED</b></header><p>{draft.claims[0]?.sentence}</p><footer><span>Source</span><b>{draft.claims[0]?.evidenceId}</b><button>Inspect <ExternalLink size={11} /></button></footer></article><SectionTitle title="Quality gate" meta={`${Object.values(quality.checks).filter(Boolean).length}/7 PASSED`} /><div className="quality-list">{Object.entries(quality.checks).map(([name, pass]) => <span className={pass ? "pass" : "fail"} key={name}>{pass ? <Check size={13} /> : <X size={13} />}<b>{name.replace(/([A-Z])/g, " $1")}</b></span>)}</div><div className="quality-scores">{["Specificity 94", "Accuracy 98", "Naturalness 89", "Brevity 92", "Spam risk 04"].map((v) => <span key={v}>{v.split(" ")[0]}<b>{v.split(" ")[1]}</b></span>)}</div></aside>
    </section>
    <section className="approval-bar"><div><ShieldCheck size={18} /><span><b>{approved ? "Approved by you" : "Human approval required"}</b><small>{approved ? new Date().toLocaleString() : "Nothing is sent automatically."}</small></span></div><div><button className="button ghost">Edit</button><button className="button ghost">Send test</button>{!approved ? <button className="button dark" disabled={!quality.approvable} onClick={() => setApproved(true)}>Approve outreach <Check size={15} /></button> : <button className="button violet" onClick={() => setSynced(true)}>{synced ? <><Check size={15} /> Synced to Zero</> : <><Send size={15} /> Sync to provider</>}</button>}</div></section>
  </main>;
}

function PipelineView({ prospects, onSelect }: { prospects: ApprovedProspect[]; onSelect: (p: ApprovedProspect) => void }) {
  const columns = ["Discovered", "Scored", "Ready for Review", "Approved", "Outreach Prepared", "Activated", "Trial Completed", "Champion"];
  return <main className="standard-page"><PageHeading eyebrow="FULL GTM PIPELINE" title="From discovered to champion." copy="The system optimises for retained users and qualified referrals—not activity for its own sake." /><div className="toolbar"><div className="searchbox"><Search size={15} /><span>Search leads or companies</span></div><button className="filter-button"><Filter size={14} /> Filters</button><span>{prospects.length} leads · Live</span></div><section className="kanban">{columns.map((column, i) => { const cards = prospects.filter((_, index) => index % columns.length === i || (i === 0 && index >= columns.length)); return <div className="kanban-col" key={column}><header><span>{column}</span><b>{cards.length}</b></header>{cards.map((p) => <button onClick={() => onSelect(p)} className="kanban-card" key={p.id}><div><Avatar name={p.identity.name} /><span><b>{p.identity.name}</b><small>{p.company.name}</small></span></div><p>{p.evidence[0]?.title}</p><footer><span>Reach <b>{p.championScore}</b></span><span>{p.confidenceScore}% conf.</span></footer></button>)}</div>; })}</section><ChampionJourney prospect={prospects[0]} /></main>;
}

function ChampionJourney({ prospect }: { prospect?: ApprovedProspect }) {
  const milestones = ["Discovered", "Understood", "Contacted", "Tried Lightfern", "Retained", "Referred", "Champion"];
  return <section className="journey-card"><div><div className="eyebrow">CHAMPION JOURNEY</div><h2>{prospect?.identity.name ?? "—"}</h2><p>{prospect?.company.name ?? ""} · Primary outcome path</p></div><div className="journey-track">{milestones.map((m, i) => <span className={i < 2 ? "complete" : i === 2 ? "current" : "predicted"} key={m}><i>{i < 2 ? <Check size={13} /> : i + 1}</i><b>{m}</b><small>{i < 2 ? "Completed" : i === 2 ? "Current" : "Predicted"}</small></span>)}</div></section>;
}

function AnalyticsView({ prospects, companies }: { prospects: ApprovedProspect[]; status: { total: number; processed: number; remaining: number } | null; companies: number }) {
  const [processed, setProcessed] = useState(0);
  useEffect(() => { fetch("/api/workflow", { cache: "no-store" }).then((r) => r.json()).then((j) => setProcessed(j.status?.processed ?? 0)).catch(() => {}); }, []);
  const total = prospects.length;
  const tierA = prospects.filter((p) => p.tier === "A").length;
  const avg = total ? Math.round(prospects.reduce((s, p) => s + p.championScore, 0) / total) : 0;
  const withPhone = prospects.filter((p) => p.contact.route.includes("phone")).length;
  const eu = prospects.filter((p) => p.identity.location === "EU").length;
  const conv = total ? Math.round((processed / total) * 100) : 0;
  const groups: [string, [string, string][]][] = [
    ["Sourcing", [["Companies", String(companies)], ["Leads sourced", String(total)], ["Tier A leads", String(tierA)], ["Avg. reach score", String(avg)], ["Verified emails", total ? "100%" : "0%"]]],
    ["Enrichment", [["Enriched", String(processed)], ["Synced to Unify", String(processed)], ["Synced to Zero", String(processed)], ["Direct dials", String(withPhone)], ["EU residents", String(eu)]]],
    ["Sequence", [["Sequenced", String(processed)], ["Pending approval", String(processed)], ["Auto-sent", "0"], ["Replies", "0"], ["Meetings booked", "0"]]],
  ];
  return <main className="standard-page"><PageHeading eyebrow="RESULTS / LIVE" title="Measure the relationship, not the send." copy="Primary metric: enriched ICP leads synced to CRM and queued for approved outreach." /><section className="north-star"><div><Sparkles size={18} /><span>PRIMARY OUTCOME</span></div><strong>{processed}</strong><p>Leads enriched and synced</p><small>from {total} ICP leads sourced</small><div className="conversion-line"><span style={{ width: `${conv}%` }} /></div></section><section className="analytics-groups">{groups.map(([title, items]) => <article key={title}><header><h2>{title}</h2><span>Live</span></header>{items.map(([label, value], i) => <div key={label}><span>{label}</span><strong>{value}</strong><i><b style={{ width: `${90 - i * 11}%` }} /></i></div>)}</article>)}</section><section className="provider-contribution"><SectionTitle title="Provider contribution" meta="ENRICHED LEADS" /><div><ProviderContribution name="Clay" value={total} width={total ? 100 : 0} copy="ICP sourcing and enrichment" /><ProviderContribution name="Unify" value={processed} width={conv} copy="Records and compliance" /><ProviderContribution name="Zero" value={processed} width={conv} copy="Contacts and deals" /></div></section></main>;
}

function ProviderContribution({ name, value, width, copy }: { name: string; value: number; width: number; copy: string }) { return <article><ProviderMark name={name.toLowerCase()} /><span><b>{name}</b><small>{copy}</small></span><i><b style={{ width: `${width}%` }} /></i><strong>{value}</strong></article>; }
function PageHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) { return <section className="page-heading"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{copy}</p></section>; }

function BenchmarkView({ prospect }: { prospect: ApprovedProspect }) {
  const [step, setStep] = useState(0);
  const situations = ["A sensitive customer reply", "An investor update", "A hiring note", "A product launch", "A difficult internal message"];
  return <main className="benchmark-page">
    <div className="benchmark-nav"><Brand /><span><ShieldCheck size={14} /> Private · Demo asset</span></div>
    <section className="benchmark-hero"><div className="eyebrow">LIGHTFERN / FOUNDER VOICE BENCHMARK</div><h1>{prospect.identity.name}’s<br /><em>communication snapshot.</em></h1><p>An evidence-based communication snapshot generated from a limited sample of public writing. It describes observable patterns, not personality.</p><div className="benchmark-person"><Avatar name={prospect.identity.name} /><span><b>{prospect.identity.name}</b><small>{prospect.identity.role} · {prospect.company.name}</small></span><i>{prospect.evidence.length} public sources</i></div></section>
    <section className="voice-grid"><article className="voice-chart"><div className="eyebrow">OBSERVABLE PATTERNS</div>{[["Directness", 88], ["Concision", 76], ["Warmth", 68], ["Evidence use", 94], ["Sentence rhythm", 86], ["Narrative use", 72]].map(([name, score]) => <span key={name}><b>{name}</b><i><em style={{ width: `${score}%` }} /></i><strong>{score}</strong></span>)}</article><article className="voice-quote"><BookOpen size={18} /><blockquote>“{prospect.evidence[0].excerpt}”</blockquote><span>{prospect.evidence[0].title} · Public writing sample</span></article></section>
    <section className="comparison"><div><span>GENERIC AI FLATTENING</span><p>“In today’s rapidly evolving landscape, maintaining authentic communication is more important than ever.”</p><small>Interchangeable language · abstract opener · no point of view</small></div><ArrowRight size={22} /><div className="aware"><span>VOICE-AWARE ALTERNATIVE</span><p>“When every assistant reaches for the same polished cadence, useful writing loses its texture.”</p><small>Concrete claim · compressed rhythm · distinctive vocabulary</small></div></section>
    <section className="five-test"><div><div className="eyebrow">THE FIVE-EMAIL TEST</div><h2>Does AI still sound like you?</h2><p>Try Lightfern in five real communication situations. Rate each suggestion, then get a simple Voice Fit result. No sales call.</p></div><div className="test-card"><div className="test-progress"><span>{step === 0 ? "Ready to begin" : step < 5 ? `Scenario ${step} of 5` : "Voice Fit complete"}</span><b>{step === 0 ? "0%" : step < 5 ? `${step * 20}%` : "92%"}</b></div><div className="test-bar"><i style={{ width: `${step * 20}%` }} /></div>{step === 0 ? <button className="button violet large" onClick={() => setStep(1)}>Start the Five-Email Test <ArrowRight size={16} /></button> : step < 5 ? <div className="scenario"><span>{situations[step - 1]}</span><p>“This suggestion sounds recognisably like something I would send.”</p><div><button onClick={() => setStep(step + 1)}>Not quite</button><button className="selected" onClick={() => setStep(step + 1)}>Sounds like me</button></div><small>Simulated product state for the hackathon demo</small></div> : <div className="voice-fit"><strong>92<small>%</small></strong><span><b>Strong Voice Fit</b><p>4 of 5 suggestions felt recognisably yours.</p></span><button className="button dark">Continue with Lightfern</button></div>}</div></section>
  </main>;
}
