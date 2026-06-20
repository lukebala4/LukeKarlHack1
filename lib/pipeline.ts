/**
 * Discovery → qualification → enrichment → scoring → personalization pipeline.
 *
 * Cost-conscious progressive enrichment (per the brief):
 *   Stage 1  cheap discovery (curated/CSV ICP)
 *   Stage 2  preliminary fit score; drop obvious low-fit
 *   Stage 3  deeper enrichment only above ENRICH_MIN_SCORE
 *   Stage 4  content/mission research for likely Tier A/B
 *   Stage 5  contact routes only for likely-outreach prospects
 *
 * Produces ONE unified prospect record per person with provenance + an explainable score.
 */
import { env } from "@/lib/env";
import { recommendChannel, scoreProspect } from "@/lib/scoring";
import { SEED, type RawSeed } from "@/lib/seed";
import type {
  CostLedgerEntry,
  PersonalizationBrief,
  Provenance,
  UnifiedProspect,
} from "@/lib/types";

const now = () => new Date().toISOString();

function prov(field: string, value: any, partial: Partial<Provenance> = {}): Provenance {
  return {
    field, value: value ?? null, provider: "seed", sourceType: "curated_seed",
    observed: true, verified: false, confidence: 0.7, retrievedAt: now(), ...partial,
  };
}

function inferEmail(seed: RawSeed): { email?: string; provenance?: Provenance } {
  if (!seed.emailPattern || !seed.domain) return {};
  const [first, ...rest] = seed.name.toLowerCase().split(" ");
  const last = rest.pop() ?? "";
  const local = seed.emailPattern === "first" ? first : `${first}.${last}`;
  const email = `${local}@${seed.domain}`;
  return {
    email,
    provenance: prov("email", email, { provider: "inference", sourceType: "pattern_inference", observed: false, verified: false, confidence: 0.35 }),
  };
}

/** Rule-based personalization brief. Demonstrates "outreach-as-craft": references the
 *  prospect's actual content/trigger. Swap in Claude (ANTHROPIC_API_KEY) for richer copy. */
function buildPersonalization(seed: RawSeed, tier: string): PersonalizationBrief {
  const trigger = seed.intent?.[0]?.summary;
  const flagship = seed.content?.[0];
  const themes = flagship?.themes ?? [];
  const tasteAngle = themes.some((t) => ["taste", "ai-slop", "voice", "craft"].includes(t));

  const valueProp = tasteAngle
    ? "Lightfern keeps your distinct voice intact at scale — the opposite of the homogenised AI writing you've been calling out."
    : "Lightfern helps your team write outbound that sounds human and gets replies — voice-aware autocomplete for high-stakes email.";

  const hook = flagship
    ? `Your piece "${flagship.title}" is exactly the thesis Lightfern is built on`
    : trigger
      ? `Saw ${trigger.toLowerCase()} — timely moment to talk voice-preserving comms`
      : `Your work on ${seed.title.toLowerCase()} maps tightly to what we're building`;

  const cta = tier === "A"
    ? "Open to a 15-min look — and, if it resonates, becoming an early voice we build alongside?"
    : "Worth a quick look? Happy to send early access.";

  const draftOpener = flagship
    ? `${seed.name.split(" ")[0]} — "${flagship.title}" stuck with me. The line about ${themes[0] ?? "voice"} is precisely why we built Lightfern: autocomplete that adapts to *your* voice instead of flattening everyone into the same em-dash mush.`
    : trigger
      ? `${seed.name.split(" ")[0]} — congrats on ${trigger.toLowerCase()}. As you scale outbound, the fastest way to tank reply rates is to sound like everyone else's AI. That's the exact problem Lightfern solves.`
      : `${seed.name.split(" ")[0]} — given your work at ${seed.companyName}, you're living the high-stakes-comms problem Lightfern was built for.`;

  return {
    triggerEvent: trigger,
    valueProp, hook, cta, draftOpener,
    warmIntroPath: seed.signals.isVcOrAccelerator ? "Likely shares investors/operators with Lightfern's network — check for a warm intro." : undefined,
    evidence: [
      flagship ? `Flagship content: "${flagship.title}" (${themes.join(", ")})` : "",
      trigger ? `Trigger: ${trigger}` : "",
      seed.signals.runsNewsletter ? `Runs a newsletter (${seed.signals.newsletterSubscribers ?? "?"} subs)` : "",
    ].filter(Boolean),
    generatedBy: "rules",
  };
}

export type PipelineResult = {
  prospects: UnifiedProspect[];
  ledger: CostLedgerEntry[];
  stats: {
    discovered: number;
    qualified: number;
    enriched: number;
    champions: number;
    droppedLowFit: number;
    tiers: Record<string, number>;
  };
};

export function runPipeline(opts?: { enrichMin?: number; championMin?: number }): PipelineResult {
  const enrichMin = opts?.enrichMin ?? env.enrichMinScore;
  const championMin = opts?.championMin ?? env.championMinScore;
  const ledger: CostLedgerEntry[] = [];
  const prospects: UnifiedProspect[] = [];
  let droppedLowFit = 0;
  let enriched = 0;
  const tiers: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

  // Stage 1 — discovery (cheap, curated)
  ledger.push({ provider: "seed", operation: "discover ICP accounts+people", timestamp: now(), success: true, cacheStatus: "hit", retryCount: 0, note: `${SEED.length} candidates` });

  for (const seed of SEED) {
    const provenance: Provenance[] = [
      prov("name", seed.name), prov("title", seed.title),
      prov("company.name", seed.companyName), prov("company.domain", seed.domain ?? null),
    ];

    // Stage 2 — preliminary fit score (free, in-memory)
    const score = scoreProspect({ signals: seed.signals, title: seed.title, company: { isAiNative: seed.isAiNative } }, { championMin });

    // Stage 3 gate — drop obvious low-fit below ENRICH_MIN_SCORE before paid enrichment
    if (score.total < enrichMin) {
      droppedLowFit++;
      tiers[score.tier]++;
      ledger.push({ provider: "pipeline", operation: `gate:drop ${seed.name}`, timestamp: now(), success: true, cacheStatus: "n/a", retryCount: 0, note: `score ${score.total} < ${enrichMin}` });
      // Still emit the record (status discovered) so reviewers can see why it was dropped.
      prospects.push(assemble(seed, score, provenance, "discovered"));
      continue;
    }

    // Stage 4/5 — enrichment for qualified prospects (here: email inference + content/contact routes)
    enriched++;
    const { email, provenance: emailProv } = inferEmail(seed);
    if (emailProv) provenance.push(emailProv);
    ledger.push({ provider: "inference", operation: `enrich:email ${seed.name}`, timestamp: now(), success: !!email, cacheStatus: "miss", retryCount: 0, estCostUsd: 0, note: email ? "pattern-inferred (unverified)" : "no pattern" });

    const status = score.tier === "A" || score.tier === "B" ? "outreach_ready" : "qualified";
    const record = assemble(seed, score, provenance, status, email);
    record.personalization = buildPersonalization(seed, score.tier);
    tiers[score.tier]++;
    prospects.push(record);
  }

  prospects.sort((a, b) => b.score.total - a.score.total);

  return {
    prospects, ledger,
    stats: {
      discovered: SEED.length,
      qualified: prospects.filter((p) => p.status !== "discovered").length,
      enriched,
      champions: prospects.filter((p) => p.score.isChampion).length,
      droppedLowFit,
      tiers,
    },
  };
}

function assemble(
  seed: RawSeed,
  score: ReturnType<typeof scoreProspect>,
  provenance: Provenance[],
  status: UnifiedProspect["status"],
  email?: string,
): UnifiedProspect {
  const contactRoutes: UnifiedProspect["contactRoutes"] = [];
  if (email) contactRoutes.push({ channel: "email", value: email, verified: false, confidence: 0.35, provider: "inference" });
  if (seed.linkedin) contactRoutes.push({ channel: "linkedin", value: seed.linkedin, verified: true, confidence: 0.9, provider: "seed" });
  if (seed.x) contactRoutes.push({ channel: "x", value: seed.x, verified: true, confidence: 0.9, provider: "seed" });
  if (seed.signals.runsNewsletter && seed.signals.newsletterUrl) contactRoutes.push({ channel: "newsletter_reply", value: seed.signals.newsletterUrl, verified: true, confidence: 0.8, provider: "seed" });

  const channel = recommendChannel({ signals: seed.signals, x: seed.x, linkedin: seed.linkedin, contactRoutes });

  return {
    id: slug(seed.name) + "-" + (seed.domain ?? "x"),
    name: seed.name,
    title: seed.title,
    company: { name: seed.companyName, domain: seed.domain, isAiNative: seed.isAiNative, fundingStage: seed.fundingStage },
    location: seed.location,
    linkedin: seed.linkedin,
    x: seed.x,
    website: seed.website,
    signals: seed.signals,
    intent: (seed.intent ?? []).map((i) => ({ type: i.type, summary: i.summary, occurredAt: i.occurredAt, provider: "seed", sourceUrl: i.sourceUrl, confidence: 0.7 })),
    content: (seed.content ?? []).map((c) => ({ title: c.title, kind: c.kind, url: c.url, excerpt: c.excerpt, themes: c.themes, provider: "seed" })),
    contactRoutes,
    score,
    channel,
    status,
    provenance,
  };
}

function slug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
