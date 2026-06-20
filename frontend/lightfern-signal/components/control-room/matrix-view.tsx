"use client";

import { useEffect, useState } from "react";
import { ArrowRight, RefreshCw, Sparkles, X } from "lucide-react";
import { ApprovedProspect } from "@/src/contracts/outreach";

const TIER: Record<string, string> = { A: "var(--green)", B: "var(--amber)", C: "var(--muted)" };

/** Engagement (mission axis) derived from the lead's recent LinkedIn engagement / thought leadership. */
function engagementScore(text?: string): number {
  if (!text) return 50;
  const s = text.toLowerCase();
  if (s.includes("active poster")) return 90;
  if (s.includes("recent:")) return 80;
  if (s.includes("posts/week") || s.includes("post")) return 72;
  if (s.includes("followers")) return 60;
  return 52;
}

export function MatrixView({ prospects, onOutreach }: { prospects: ApprovedProspect[]; onOutreach: (p: ApprovedProspect) => void }) {
  const [enrolled, setEnrolled] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  const load = () => {
    setError(null);
    fetch("/api/workflow", { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(`backend ${r.status}`); return r.json(); })
      .then((d) => setEnrolled(d.enrolledIds ?? []))
      .catch(() => setError("Backend not connected — start the Stage 1 server on :3000, then retry."));
  };
  useEffect(load, []);

  const people = (enrolled ? prospects.filter((p) => enrolled.includes(p.id)) : []).map((p) => {
    const reach = p.championScore;
    const mission = engagementScore(p.evidence[0]?.excerpt);
    const isChampion = reach >= 78 && mission >= 70;
    const tier = isChampion ? "A" : reach >= 70 || mission >= 70 ? "B" : "C";
    return { p, reach, mission, isChampion, tier };
  });
  const champions = people.filter((x) => x.isChampion).length;
  const ranked = [...people].sort((a, b) => b.reach + b.mission - (a.reach + a.mission));
  const selected = people.find((x) => x.p.id === sel);

  return <main className="standard-page">
    <section className="page-heading"><div className="eyebrow">CHAMPION ENGINE / SCORING MATRIX</div><h1>Champions, not just users.</h1><p>Your enrolled leads, scored on two axes — reach (audience) and engagement (recent public activity). A champion is strong on both.</p></section>

    {error && <section className="wf-error" role="alert"><X size={15} /><span>{error}</span><button className="button ghost compact" onClick={load}><RefreshCw size={13} /> Retry</button></section>}

    {enrolled && people.length === 0 && !error && (
      <div className="activity-empty" style={{ padding: "70px 20px" }}><Sparkles size={26} /><span>No enrolled leads yet. Pick a number and <b>Run Signal</b> in the Control Room — your enrolled champions appear here.</span></div>
    )}

    {people.length > 0 && <div className="quad-layout">
      <article className="quad-card">
        <div className="quad-head"><span>CHAMPION QUADRANT</span><b>{champions} champions · {people.length} enrolled</b></div>
        <div className="quad-grid">
          <div className="quad-cell tl">Engaged</div>
          <div className="quad-cell tr"><Sparkles size={11} /> Champion</div>
          <div className="quad-cell bl">Low fit</div>
          <div className="quad-cell br">Megaphone</div>
          {people.map(({ p, reach, mission, isChampion, tier }) => (
            <button key={p.id} className={`quad-dot ${sel === p.id ? "sel" : ""}`} aria-label={p.identity.name}
              title={`${p.identity.name} — reach ${reach}, engagement ${mission}`}
              onClick={() => setSel(p.id)}
              style={{ left: `${reach}%`, bottom: `${mission}%`, background: TIER[tier], boxShadow: isChampion ? "0 0 0 4px rgba(61,105,88,.22)" : undefined }} />
          ))}
        </div>
        <div className="quad-axes"><span>reach →</span><span>↑ engagement</span></div>
      </article>

      <aside className="quad-list">
        <div className="section-title"><h3>Enrolled leads</h3><span>{champions} CHAMPIONS</span></div>
        <div className="quad-rows">
          {ranked.map(({ p, reach, mission, tier }) => (
            <button key={p.id} className={`quad-row ${sel === p.id ? "sel" : ""}`} onClick={() => setSel(p.id)}>
              <i style={{ background: TIER[tier] }}>{tier}</i>
              <span><b>{p.identity.name}</b><small>{p.identity.role} · {p.company.name}</small></span>
              <div className="quad-mini"><em>R {reach}</em><em>E {mission}</em></div>
              <strong>{Math.round((reach + mission) / 2)}</strong>
            </button>
          ))}
        </div>
      </aside>
    </div>}

    {selected && (
      <section className="quad-detail">
        <header><i style={{ background: TIER[selected.tier] }}>{selected.tier}</i><div><b>{selected.p.identity.name}</b><small>{selected.p.identity.role} · {selected.p.company.name}</small></div>{selected.isChampion && <span className="quad-champ"><Sparkles size={12} /> Champion</span>}<button className="icon-button" onClick={() => setSel(null)} aria-label="Close"><X size={15} /></button></header>
        <p>{selected.p.evidence[0]?.excerpt}</p>
        <div className="quad-actions"><button className="button dark" onClick={() => onOutreach(selected.p)}>Open in Outreach <ArrowRight size={15} /></button></div>
      </section>
    )}
  </main>;
}
