"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity, ArrowRight, BarChart3, BookOpen, Check, ChevronRight, CircleStop, Clock3,
  Command, ExternalLink, FileCheck2, Filter, Inbox, Layers3, Link2, Mail,
  Network, Pause, Play, Radar, RefreshCw, Search, Send, ShieldCheck, Sparkles, UserRound,
  X, Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ApprovedProspect, ProspectPipelineEvent } from "@/src/contracts/outreach";
import { fixtureProspects } from "@/src/repositories/fixtures";
import { calculateReadiness, generateEmailDraft, selectOutreachPlay, validateDraft } from "@/src/outreach/engine";
import { ScoreBars } from "@/components/visualisations/score-bars";

type View = "landing" | "control" | "outreach" | "pipeline" | "analytics" | "benchmark";
type DemoState = "idle" | "running" | "paused" | "complete";

const discoverySteps = ["Searching companies", "Finding founders", "Enriching profiles", "Reading public signals", "Detecting distinctive voices", "Calculating Champion Scores", "Preparing review queue"];
const activateSteps = ["Checking outreach readiness", "Selecting strongest evidence", "Choosing outreach play", "Building personal approach", "Awaiting approval", "Ready to activate"];
const stageLabels = ["Found", "Enriching", "Researching", "Scored", "Review", "Approved", "Outreach Ready", "Play Selected", "Drafted", "Activated", "Champion"];
const demoMessages = [
  ["provider.connected", "Unify connected to the demo workspace.", "unify"],
  ["provider.connected", "Zero contact graph connected.", "zero"],
  ["provider.connected", "Scaile search intelligence connected.", "scaile"],
  ["company.discovered", "Unify found 18 AI-native companies.", "unify"],
  ["founder.discovered", "Six founder profiles match the configured signal.", "internal"],
  ["evidence.found", "Found Maya’s critique of generic AI writing.", "scaile"],
  ["evidence.found", "Found Jon’s distinctive weekly newsletter.", "scaile"],
  ["score.completed", "Maya Chen’s Champion Score increased from 76 to 91.", "internal"],
  ["prospect.ready_for_review", "Three Tier A founders are ready for review.", "internal"],
  ["prospect.approved", "Maya Chen approved by Demo Operator.", "internal"],
  ["prospect.sent_to_outreach", "Maya moved from Discover into Activate.", "internal"],
  ["outreach_play.selected", "Founder Voice Benchmark selected; research email is fallback.", "internal"],
  ["email.draft_created", "Research-led email created with one verified claim.", "internal"],
  ["asset.created", "Private founder benchmark created.", "internal"],
  ["outreach.ready_for_approval", "Draft passed the quality gate and awaits approval.", "internal"],
  ["provider.synced", "Approved outreach synced to Zero with an idempotency key.", "zero"],
  ["trial.started", "Five-Email Test started — simulated product event.", "internal"],
  ["trial.completed", "Five of five scenarios completed; Voice Fit 92%.", "internal"],
  ["referral.created", "Qualified founder referral created — simulated product event.", "internal"],
  ["champion.created", "Maya progressed to Champion.", "internal"],
  ["job.completed", "Demo Run completed successfully.", "internal"],
] as const;

export function SignalApp({ initialView = "landing" }: { initialView?: View }) {
  const reduced = useReducedMotion();
  const [view, setView] = useState<View>(initialView);
  const [demo, setDemo] = useState<DemoState>("idle");
  const [events, setEvents] = useState<ProspectPipelineEvent[]>([]);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<ApprovedProspect | null>(null);
  const [outreachProspect, setOutreachProspect] = useState(fixtureProspects[0]);

  useEffect(() => {
    if (demo !== "running" || progress >= demoMessages.length) return;
    const delay = reduced ? 40 : progress < 4 ? 500 : 720;
    const timer = setTimeout(() => {
      const [type, message, provider] = demoMessages[progress];
      setEvents((current) => [...current, {
        id: `demo-event-${progress}`, jobId: "demo-run-001", type, message, provider,
        timestamp: new Date(Date.now() + progress * 1000).toISOString(), demo: true,
        prospectId: progress >= 5 ? "maya-chen" : undefined, payload: { deterministic: true },
      } as ProspectPipelineEvent]);
      setProgress((n) => n + 1);
      if (progress + 1 === demoMessages.length) setDemo("complete");
    }, delay);
    return () => clearTimeout(timer);
  }, [demo, progress, reduced]);

  const runDemo = () => {
    setView("control"); setDemo("running"); setEvents([]); setProgress(0);
  };

  if (view === "landing") return <Landing onEnter={() => setView("control")} onDemo={runDemo} reduced={!!reduced} />;

  return <div className="app-shell">
    <AppHeader view={view} setView={setView} demo={demo} runDemo={runDemo} />
    {view === "control" && <ControlRoom demo={demo} setDemo={setDemo} progress={progress} events={events} onSelect={setSelected} onOutreach={(p) => { setOutreachProspect(p); setView("outreach"); }} runDemo={runDemo} />}
    {view === "outreach" && <OutreachWorkspace prospect={outreachProspect} onBenchmark={() => setView("benchmark")} />}
    {view === "pipeline" && <PipelineView onSelect={setSelected} />}
    {view === "analytics" && <AnalyticsView />}
    {view === "benchmark" && <BenchmarkView prospect={outreachProspect} />}
    <AnimatePresence>{selected && <IntelligenceDrawer prospect={selected} close={() => setSelected(null)} onApprove={() => { setOutreachProspect(selected); setSelected(null); setView("outreach"); }} />}</AnimatePresence>
  </div>;
}

function Landing({ onEnter, onDemo, reduced }: { onEnter: () => void; onDemo: () => void; reduced: boolean }) {
  return <main className="landing">
    <nav className="landing-nav"><Brand /><div><button className="text-button" onClick={onDemo}>Watch demo run</button><button className="button dark" onClick={onEnter}>Enter Control Room <ArrowRight size={16} /></button></div></nav>
    <section className="hero">
      <motion.div initial={{ opacity: 0, y: reduced ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} className="hero-copy">
        <div className="eyebrow"><Sparkles size={13} /> GTM intelligence, with evidence</div>
        <h1>Find the voices<br />worth <em>amplifying.</em></h1>
        <p>Lightfern Signal discovers founders whose communication matters, understands what makes their voice distinctive, and turns genuine research into high-trust relationships.</p>
        <div className="hero-actions"><button className="button dark large" onClick={onEnter}>Enter Control Room <ArrowRight size={18} /></button><button className="button ghost large" onClick={onDemo}><Play size={17} fill="currentColor" /> Run Demo</button></div>
      </motion.div>
      <motion.div className="hero-system" initial={{ opacity: 0, scale: reduced ? 1 : .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .15 }}>
        <div className="system-top"><span className="live-dot" /> Signal operating system <small>DEMO READY</small></div>
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

function AppHeader({ view, setView, demo, runDemo }: { view: View; setView: (v: View) => void; demo: DemoState; runDemo: () => void }) {
  const nav = [["control", "Control Room", Command], ["outreach", "Outreach", Mail], ["pipeline", "Pipeline", Layers3], ["analytics", "Analytics", BarChart3]] as const;
  return <header className="app-header">
    <button className="brand-button" onClick={() => setView("landing")} aria-label="Lightfern Signal home"><Brand /></button>
    <nav>{nav.map(([id, label, Icon]) => <button className={view === id ? "active" : ""} onClick={() => setView(id)} key={id}><Icon size={15} />{label}</button>)}</nav>
    <div className="header-actions"><span className={`mode-pill ${demo !== "idle" ? "active" : ""}`}><i />{demo === "idle" ? "REAL MODE" : "DEMO RUN"}</span><button className="button dark compact" onClick={runDemo}><Play size={14} fill="currentColor" /> Run Signal</button></div>
  </header>;
}

function ControlRoom({ demo, setDemo, progress, events, onSelect, onOutreach, runDemo }: {
  demo: DemoState; setDemo: (s: DemoState) => void; progress: number; events: ProspectPipelineEvent[];
  onSelect: (p: ApprovedProspect) => void; onOutreach: (p: ApprovedProspect) => void; runDemo: () => void;
}) {
  const visible = demo === "idle" ? fixtureProspects.slice(0, 3) : fixtureProspects.slice(0, Math.max(1, Math.min(6, Math.floor(progress / 2))));
  return <main className="control-page">
    <section className="control-title">
      <div><div className="eyebrow">CONTROL ROOM / <span>DEMO WORKSPACE</span></div><h1>One signal. Two engines.</h1><p>Discover unusually valuable founder voices, then activate the strongest route with evidence and human judgment.</p></div>
      <div className="run-controls">
        {demo === "running" && <><button className="icon-button" onClick={() => setDemo("paused")} aria-label="Pause run"><Pause size={16} /></button><button className="icon-button danger" onClick={() => setDemo("idle")} aria-label="Stop run"><CircleStop size={16} /></button></>}
        {demo === "paused" && <button className="icon-button" onClick={() => setDemo("running")} aria-label="Resume run"><Play size={16} /></button>}
        <button className="button dark large" onClick={runDemo}>{demo === "running" ? <><Activity size={17} /> Signal running</> : <><Play size={16} fill="currentColor" /> Run Signal</>}</button>
      </div>
    </section>
    <section className="stats-strip">
      <Metric label="Companies found" value={demo === "idle" ? "—" : Math.min(18, progress * 2).toString()} change="Unify" />
      <Metric label="Founders understood" value={demo === "idle" ? "—" : Math.min(6, Math.floor(progress / 2)).toString()} change="3 Tier A" />
      <Metric label="Evidence coverage" value={demo === "idle" ? "—" : `${Math.min(94, 36 + progress * 3)}%`} change="Observed" />
      <Metric label="Outreach ready" value={progress > 13 ? "1" : "0"} change="Human gated" />
      <Metric label="Champions created" value={progress >= 20 ? "1" : "0"} change="Primary outcome" accent />
    </section>
    <section className="provider-rail">
      <Provider name="Unify" initial="U" color="#485f92" state={progress > 2 ? "Searching" : demo === "idle" ? "Idle" : "Connected"} count={progress > 3 ? 18 : 0} operation="Company and audience signals" />
      <Provider name="Zero" initial="Z" color="#8c6948" state={progress > 4 ? "Enriching" : demo === "idle" ? "Idle" : "Connected"} count={progress > 4 ? 7 : 0} operation="Contact and relationship graph" />
      <Provider name="Scaile" initial="S" color="#685c8f" state={progress > 5 ? "Searching" : demo === "idle" ? "Idle" : "Connected"} count={progress > 5 ? 4 : 0} operation="Search themes and public evidence" />
    </section>
    <section className="engine-layout">
      <div className="engine-column discovery-engine">
        <EngineHead number="01" title="Discover" subtitle="Who is worth understanding?" color="green" />
        <StageTrack labels={discoverySteps} active={Math.min(6, Math.floor(progress / 2))} />
        <div className="prospect-list">{visible.map((p, index) => <ProspectCard key={p.id} prospect={p} stage={stageLabels[Math.min(4, Math.max(0, Math.floor((progress - index) / 2)))]} onClick={() => onSelect(p)} />)}</div>
      </div>
      <div className="handoff">
        <div className={progress > 9 ? "handoff-line active" : "handoff-line"}><span /><motion.i animate={progress > 9 ? { x: [0, 28, 0] } : {}} transition={{ repeat: Infinity, duration: 2 }}><ChevronRight size={15} /></motion.i><span /></div>
        <small>HUMAN<br />APPROVAL</small>
      </div>
      <div className="engine-column activate-engine">
        <EngineHead number="02" title="Activate" subtitle="How do we earn attention?" color="violet" />
        <StageTrack labels={activateSteps} active={Math.max(-1, Math.floor((progress - 9) / 2))} />
        {progress > 9 ? <ProspectCard prospect={fixtureProspects[0]} stage={stageLabels[Math.min(10, 5 + Math.floor((progress - 9) / 2))]} onClick={() => onOutreach(fixtureProspects[0])} outreach /> : <div className="empty-activate"><Inbox size={24} /><h3>Awaiting an approved signal</h3><p>High-scoring prospects enter Activate only after a human reviews the evidence.</p></div>}
      </div>
    </section>
    <section className="activity-panel">
      <div className="panel-head"><div><span className="live-dot" /><h2>Live activity</h2><small>{demo === "running" ? "Receiving deterministic demo events" : "Activity persists by job"}</small></div><button className="filter-button"><Filter size={14} /> Filter</button></div>
      <div className="activity-list" aria-live="polite">
        {events.length === 0 && <div className="activity-empty"><Activity size={22} /><span>Run Signal to see provider and pipeline events.</span></div>}
        {[...events].reverse().slice(0, 8).map((event) => <div className="activity-row" key={event.id}><ProviderMark name={event.provider} /><span className="activity-message">{event.message}</span><span className="event-type">{event.type}</span><time>{new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time><b>DEMO</b></div>)}
      </div>
    </section>
  </main>;
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
  return <main className="outreach-page">
    <section className="workspace-head">
      <div><div className="eyebrow">ENGINE 02 / ACTIVATE / DEMO DATA</div><h1>Build an approach worth reading.</h1><p>Research first. Claims attached. Human approval before provider sync.</p></div>
      <div className="workspace-person"><Avatar name={prospect.identity.name} /><span><b>{prospect.identity.name}</b><small>{prospect.company.name}</small></span><i>{prospect.championScore}<small>Champion</small></i><i className="violet">{readiness.score}<small>Readiness</small></i></div>
    </section>
    <section className="readiness-play">
      <article className="readiness-card"><div className="readiness-score"><span style={{ "--score": readiness.score } as React.CSSProperties}><strong>{readiness.score}</strong><small>/100</small></span><div><h2>Outreach Readiness</h2><p>Can we contact them well right now?</p></div></div><div className="readiness-parts">{Object.entries(readiness.components).map(([k, v]) => <span key={k}><i style={{ width: `${v / ({ contact: 20, evidence: 25, trigger: 20, channel: 15, cta: 10, confidence: 10 }[k as keyof typeof readiness.components]) * 100}%` }} /><b>{k}</b><em>{v}</em></span>)}</div></article>
      <article className="recommended-play"><div className="eyebrow"><Sparkles size={12} /> RECOMMENDED PLAY</div><h2>{play.recommended}</h2><ul>{play.reasons.map((r) => <li key={r}><Check size={13} />{r}</li>)}</ul><footer><span>Fallback</span><b>{play.fallback}</b><button onClick={onBenchmark}>Preview asset <ArrowRight size={14} /></button></footer></article>
    </section>
    <section className="builder-grid">
      <aside className="research-pane"><div className="pane-head"><div><BookOpen size={16} /><h2>Research</h2></div><span>{prospect.evidence.length} VERIFIED</span></div><p className="pane-intro">Only evidence permitted by Stage 1 can be used in personalised claims.</p>{prospect.evidence.map((ev, i) => <article className={`research-item ${i === 0 ? "selected" : ""}`} key={ev.id}><div><span>{ev.category}</span><b>{ev.confidence}% · {ev.mode}</b></div><h3>{ev.title}</h3><p>{ev.excerpt}</p><footer><Link2 size={12} /> {ev.id}</footer></article>)}</aside>
      <section className="email-pane"><div className="pane-head"><div><Mail size={16} /><h2>Generated email</h2></div><span>DRAFT 01</span></div><div className="subject"><span>Subject</span><b>{draft.subjectOptions[0]}</b><button><RefreshCw size={13} /></button></div><div className="opening-options"><span>OPENING OPTIONS</span>{draft.openings.map((option, i) => <button className={opening === i ? "active" : ""} onClick={() => setOpening(i)} key={option}><i>{i + 1}</i><p>{option}</p>{opening === i && <Check size={15} />}</button>)}</div><div className="email-body">{draft.body.split("\n").map((line, i) => line ? <p key={i}>{i === 0 ? draft.openings[opening] : line}{i === 0 && <sup title="Supported by evidence">{1}</sup>}</p> : <br key={i} />)}</div><div className="email-meta"><span><Clock3 size={14} />{draft.timing}</span><span><Zap size={14} />CTA: {draft.cta}</span></div></section>
      <aside className="claims-pane"><div className="pane-head"><div><FileCheck2 size={16} /><h2>Claims ledger</h2></div><span>{quality.claimsValid ? "VALID" : "BLOCKED"}</span></div><article className="claim-card"><header><i>1</i><span>PERSONALISED CLAIM</span><b><ShieldCheck size={13} /> VERIFIED</b></header><p>{draft.claims[0]?.sentence}</p><footer><span>Source</span><b>{draft.claims[0]?.evidenceId}</b><button>Inspect <ExternalLink size={11} /></button></footer></article><SectionTitle title="Quality gate" meta={`${Object.values(quality.checks).filter(Boolean).length}/7 PASSED`} /><div className="quality-list">{Object.entries(quality.checks).map(([name, pass]) => <span className={pass ? "pass" : "fail"} key={name}>{pass ? <Check size={13} /> : <X size={13} />}<b>{name.replace(/([A-Z])/g, " $1")}</b></span>)}</div><div className="quality-scores">{["Specificity 94", "Accuracy 98", "Naturalness 89", "Brevity 92", "Spam risk 04"].map((v) => <span key={v}>{v.split(" ")[0]}<b>{v.split(" ")[1]}</b></span>)}</div></aside>
    </section>
    <section className="approval-bar"><div><ShieldCheck size={18} /><span><b>{approved ? "Approved by Demo Operator" : "Human approval required"}</b><small>{approved ? new Date().toLocaleString() : "Nothing is sent automatically."}</small></span></div><div><button className="button ghost">Edit</button><button className="button ghost">Send test</button>{!approved ? <button className="button dark" disabled={!quality.approvable} onClick={() => setApproved(true)}>Approve outreach <Check size={15} /></button> : <button className="button violet" onClick={() => setSynced(true)}>{synced ? <><Check size={15} /> Synced to Zero</> : <><Send size={15} /> Sync to provider</>}</button>}</div></section>
  </main>;
}

function PipelineView({ onSelect }: { onSelect: (p: ApprovedProspect) => void }) {
  const columns = ["Discovered", "Scored", "Ready for Review", "Approved", "Outreach Prepared", "Activated", "Trial Completed", "Champion"];
  return <main className="standard-page"><PageHeading eyebrow="FULL GTM PIPELINE" title="From discovered to champion." copy="The system optimises for retained users and qualified referrals—not activity for its own sake." /><div className="toolbar"><div className="searchbox"><Search size={15} /><span>Search founders or companies</span></div><button className="filter-button"><Filter size={14} /> Filters</button><span>6 prospects · Demo data</span></div><section className="kanban">{columns.map((column, i) => <div className="kanban-col" key={column}><header><span>{column}</span><b>{i < 5 ? Math.max(1, 6 - i) : i === 7 ? 1 : 0}</b></header>{fixtureProspects.filter((_, index) => index % columns.length === i || (i === 0 && index > 3)).map((p) => <button onClick={() => onSelect(p)} className="kanban-card" key={p.id}><div><Avatar name={p.identity.name} /><span><b>{p.identity.name}</b><small>{p.company.name}</small></span></div><p>{p.evidence[0]?.title}</p><footer><span>CS <b>{p.championScore}</b></span><span>{p.confidenceScore}% conf.</span></footer></button>)}</div>)}</section><ChampionJourney /></main>;
}

function ChampionJourney() {
  const milestones = ["Discovered", "Understood", "Contacted", "Tried Lightfern", "Retained", "Referred", "Champion"];
  return <section className="journey-card"><div><div className="eyebrow">CHAMPION JOURNEY</div><h2>Maya Chen</h2><p>Common Thread · Primary outcome path</p></div><div className="journey-track">{milestones.map((m, i) => <span className={i < 5 ? "complete" : i === 5 ? "current" : "predicted"} key={m}><i>{i < 5 ? <Check size={13} /> : i + 1}</i><b>{m}</b><small>{i < 5 ? "Completed" : i === 5 ? "Current" : "Predicted"}</small></span>)}</div></section>;
}

function AnalyticsView() {
  const groups = [
    ["Discovery", [["Companies found", "18"], ["Founders found", "6"], ["Tier A prospects", "4"], ["Avg. Champion Score", "83"], ["Evidence coverage", "94%"]]],
    ["Outreach", [["Outreach ready", "3"], ["Drafts approved", "2"], ["Positive replies", "1"], ["Benchmark views", "2"], ["Trial activations", "1"]]],
    ["Champion", [["Five-Email Tests", "1"], ["Retained users", "1"], ["Qualified referrals", "1"], ["Team invitations", "0"], ["Champion conversions", "1"]]],
  ] as const;
  return <main className="standard-page"><PageHeading eyebrow="RESULTS / DEMO WORKSPACE" title="Measure the relationship, not the send." copy="Primary metric: approved prospects who become retained users or create a qualified referral." /><section className="north-star"><div><Sparkles size={18} /><span>PRIMARY OUTCOME</span></div><strong>2</strong><p>Retained users or qualified referrals</p><small>from 3 outreach-ready prospects</small><div className="conversion-line"><span style={{ width: "66%" }} /></div></section><section className="analytics-groups">{groups.map(([title, items]) => <article key={title}><header><h2>{title}</h2><span>Demo data</span></header>{items.map(([label, value], i) => <div key={label}><span>{label}</span><strong>{value}</strong><i><b style={{ width: `${90 - i * 11}%` }} /></i></div>)}</article>)}</section><section className="provider-contribution"><SectionTitle title="Provider contribution" meta="QUALIFIED PROSPECTS" /><div><ProviderContribution name="Unify" value={6} width={82} copy="Companies and audience" /><ProviderContribution name="Zero" value={5} width={68} copy="Contact and relationships" /><ProviderContribution name="Scaile" value={4} width={55} copy="Themes and evidence" /></div></section></main>;
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
