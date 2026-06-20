/**
 * Lightfern Champion Score — explainable, evidence-based.
 *
 * Two axes from the brief:
 *   • REACH / network-effect potential (audience, seniority, VC/accelerator, thought leadership)
 *   • MISSION / taste alignment (anti-slop discourse, newsletter, distinct voice, AI-stack building)
 * Plus an EMAIL-VOLUME estimate (the brief requires high-email-volume roles).
 *
 * A true CHAMPION must score high on BOTH reach and mission — a megaphone with no taste
 * won't advocate authentically, and a tasteful writer with no audience has weak network effect.
 * So the headline total deliberately rewards the *minimum* of the two axes, not the average.
 */
import type {
  ChampionScore,
  Evidence,
  ProspectSignals,
  Tier,
  UnifiedProspect,
} from "@/lib/types";

type Rule = {
  id: string;
  axis: "reach" | "mission" | "email_volume";
  signal: string;
  weight: number; // max points this rule can contribute to its axis (axes are normalised to 100)
  evaluate: (p: ScoringInput) => { hit: boolean; detail: string; confidence: number; sourceUrl?: string; fraction?: number };
};

export type ScoringInput = {
  signals: ProspectSignals;
  title?: string;
  company?: { isAiNative?: boolean };
};

function followerFraction(n?: number): number {
  if (!n) return 0;
  // 0 at 1k, ~1 at 100k+, log-scaled
  const f = (Math.log10(n) - 3) / 2;
  return Math.max(0, Math.min(1, f));
}

const HIGH_VOLUME_TITLES = [
  "founder", "ceo", "cofounder", "co-founder", "partner", "gp", "general partner",
  "head of sales", "vp sales", "cro", "chief revenue", "account executive", "ae",
  "head of growth", "head of partnerships", "partnerships", "business development",
  "bd", "investor", "venture", "community",
];

const RULES: Rule[] = [
  // ── REACH axis ──────────────────────────────────────────────────────────
  {
    id: "reach.audience", axis: "reach", signal: "Engaged audience", weight: 32,
    evaluate: (p) => {
      const frac = Math.max(followerFraction(p.signals.xFollowers), followerFraction(p.signals.linkedinFollowers));
      const n = Math.max(p.signals.xFollowers ?? 0, p.signals.linkedinFollowers ?? 0);
      return { hit: frac > 0, detail: n ? `~${n.toLocaleString()} followers (X/LinkedIn)` : "no audience data", confidence: 0.8, fraction: frac };
    },
  },
  {
    id: "reach.thought_leader", axis: "reach", signal: "Thought leader", weight: 16,
    evaluate: (p) => ({ hit: !!p.signals.isThoughtLeader, detail: p.signals.isThoughtLeader ? "Recognised thought leader" : "—", confidence: 0.7 }),
  },
  {
    id: "reach.vc_accelerator", axis: "reach", signal: "VC / accelerator", weight: 18,
    evaluate: (p) => ({ hit: !!p.signals.isVcOrAccelerator, detail: p.signals.isVcOrAccelerator ? "VC or accelerator involvement (strong network effect)" : "—", confidence: 0.85 }),
  },
  {
    id: "reach.ai_educator", axis: "reach", signal: "AI educator", weight: 12,
    evaluate: (p) => ({ hit: !!p.signals.isAiEducator, detail: p.signals.isAiEducator ? "Educates an audience about AI" : "—", confidence: 0.7 }),
  },
  {
    id: "reach.community", axis: "reach", signal: "Community / partnerships", weight: 12,
    evaluate: (p) => ({ hit: !!p.signals.worksInCommunityOrPartnerships, detail: p.signals.worksInCommunityOrPartnerships ? "Works in community/partnerships/events" : "—", confidence: 0.7 }),
  },
  {
    id: "reach.speaking", axis: "reach", signal: "Speaking / podcasts", weight: 10,
    evaluate: (p) => {
      const hit = !!(p.signals.speakingAppearances || p.signals.podcastPresence);
      return { hit, detail: hit ? "Speaks at events / appears on podcasts" : "—", confidence: 0.65 };
    },
  },

  // ── MISSION axis ────────────────────────────────────────────────────────
  {
    id: "mission.taste_aislop", axis: "mission", signal: "Taste / anti-AI-slop discourse", weight: 30,
    evaluate: (p) => ({ hit: !!p.signals.writesAboutTasteOrAiSlop, detail: p.signals.writesAboutTasteOrAiSlop ? "Engages discourse on taste / 'AI slop'" : "—", confidence: 0.8 }),
  },
  {
    id: "mission.newsletter", axis: "mission", signal: "Writes a newsletter/Substack", weight: 24,
    evaluate: (p) => ({ hit: !!p.signals.runsNewsletter, detail: p.signals.runsNewsletter ? `Runs a newsletter${p.signals.newsletterSubscribers ? ` (~${p.signals.newsletterSubscribers.toLocaleString()} subs)` : ""}` : "—", confidence: 0.85, sourceUrl: p.signals.newsletterUrl }),
  },
  {
    id: "mission.distinct_voice", axis: "mission", signal: "Distinct voice", weight: 20,
    evaluate: (p) => ({ hit: !!p.signals.distinctVoice, detail: p.signals.distinctVoice ? "Recognisably distinct written voice" : "—", confidence: 0.6 }),
  },
  {
    id: "mission.ai_stack", axis: "mission", signal: "Builds an AI stack", weight: 14,
    evaluate: (p) => ({ hit: !!p.signals.postsAboutBuildingAiStack, detail: p.signals.postsAboutBuildingAiStack ? "Posts about composing AI tools for specific needs" : "—", confidence: 0.7 }),
  },
  {
    id: "mission.high_stakes_role", axis: "mission", signal: "High-stakes comms role", weight: 12,
    evaluate: (p) => {
      const t = (p.title ?? "").toLowerCase();
      const hit = HIGH_VOLUME_TITLES.some((k) => t.includes(k));
      return { hit, detail: hit ? `Role implies relationship management & high-stakes comms (${p.title})` : "—", confidence: 0.75 };
    },
  },

  // ── EMAIL VOLUME axis ─────────────────────────────────────────────────────
  {
    id: "email.role_volume", axis: "email_volume", signal: "High-email-volume role", weight: 70,
    evaluate: (p) => {
      const t = (p.title ?? "").toLowerCase();
      const hit = HIGH_VOLUME_TITLES.some((k) => t.includes(k));
      return { hit, detail: hit ? `${p.title} — sends a lot of high-stakes email` : `${p.title ?? "unknown role"} — uncertain email volume`, confidence: 0.7 };
    },
  },
  {
    id: "email.network", axis: "email_volume", signal: "Networked operator", weight: 30,
    evaluate: (p) => {
      const hit = !!(p.signals.isVcOrAccelerator || p.signals.worksInCommunityOrPartnerships);
      return { hit, detail: hit ? "Networked role → constant outbound/intro email" : "—", confidence: 0.6 };
    },
  },
];

function axisScore(input: ScoringInput, axis: Rule["axis"]): { score: number; evidence: Evidence[] } {
  const rules = RULES.filter((r) => r.axis === axis);
  const maxWeight = rules.reduce((s, r) => s + r.weight, 0);
  let earned = 0;
  const evidence: Evidence[] = [];
  for (const r of rules) {
    const res = r.evaluate(input);
    const fraction = res.fraction ?? (res.hit ? 1 : 0);
    const points = +(r.weight * fraction).toFixed(1);
    earned += points;
    if (res.hit || fraction > 0) {
      evidence.push({
        ruleId: r.id, axis, signal: r.signal, detail: res.detail, provider: "scoring",
        sourceUrl: res.sourceUrl, observed: true, confidence: res.confidence, points,
      });
    }
  }
  return { score: Math.round((earned / maxWeight) * 100), evidence };
}

export function scoreProspect(input: ScoringInput, opts?: { championMin?: number }): ChampionScore {
  const championMin = opts?.championMin ?? 70;
  const reach = axisScore(input, "reach");
  const mission = axisScore(input, "mission");
  const email = axisScore(input, "email_volume");

  // Champion = strong on BOTH reach and mission → reward the weaker axis.
  const balanced = Math.min(reach.score, mission.score);
  const avg = (reach.score + mission.score) / 2;
  // 70% weight on the balanced (min) axis, 30% on the average; email volume is a +/- modifier.
  const core = balanced * 0.7 + avg * 0.3;
  const emailModifier = (email.score - 50) * 0.12; // ±6 pts around a neutral 50
  const total = Math.max(0, Math.min(100, Math.round(core + emailModifier)));

  let tier: Tier = "D";
  if (total >= championMin && balanced >= 55) tier = "A";
  else if (total >= 55) tier = "B";
  else if (total >= 38) tier = "C";

  const isChampion = tier === "A";
  const rationale = buildRationale(reach.score, mission.score, email.score, balanced, tier);

  return {
    total,
    reachScore: reach.score,
    missionScore: mission.score,
    emailVolumeScore: email.score,
    tier,
    isChampion,
    rationale,
    evidence: [...reach.evidence, ...mission.evidence, ...email.evidence].sort((a, b) => b.points - a.points),
  };
}

function buildRationale(reach: number, mission: number, email: number, balanced: number, tier: Tier): string {
  const parts: string[] = [];
  parts.push(`Reach ${reach}/100, Mission ${mission}/100, Email-volume ${email}/100.`);
  if (tier === "A") parts.push("Top-right quadrant: high reach AND high taste — a genuine champion candidate with authentic advocacy + network effect.");
  else if (reach >= 55 && mission < 55) parts.push("Strong reach but weaker mission alignment — a megaphone, but advocacy may feel inauthentic. Verify taste signals before prioritising.");
  else if (mission >= 55 && reach < 55) parts.push("Strong mission alignment but limited audience — an ideal *user* with modest network effect. Great for product love, weaker for amplification.");
  else parts.push("Neither axis is strong enough yet — low priority unless new signals emerge.");
  return parts.join(" ");
}

/** Channel recommendation derived from available routes + signals. */
export function recommendChannel(p: Pick<UnifiedProspect, "signals" | "x" | "linkedin" | "contactRoutes">): {
  primary: string; secondary?: string; timing: string; reason: string;
} {
  const hasEmail = p.contactRoutes?.some((r) => r.channel === "email" && r.verified);
  if (p.signals.runsNewsletter) {
    return { primary: "Newsletter reply / personal email", secondary: hasEmail ? "Email" : "X DM", timing: "Within 24h of their next issue", reason: "Replying to their newsletter shows you actually read their work — highest taste-signal channel." };
  }
  if ((p.signals.xFollowers ?? 0) > (p.signals.linkedinFollowers ?? 0) && p.x) {
    return { primary: "X DM", secondary: hasEmail ? "Email" : "LinkedIn", timing: "Right after a relevant post of theirs", reason: "Their audience and activity center on X — meet them where their voice lives." };
  }
  if (p.linkedin) {
    return { primary: "LinkedIn", secondary: hasEmail ? "Email" : "X", timing: "Tue–Thu morning", reason: "Professional context; pair with a comment on a recent post first." };
  }
  return { primary: hasEmail ? "Email" : "LinkedIn", timing: "Tue–Thu morning", reason: "Default professional channel." };
}
