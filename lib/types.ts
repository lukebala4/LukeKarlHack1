/**
 * Unified data model for the Lightfern Champion Engine.
 * One prospect record, assembled from many providers, with provenance on every
 * material field and explainable evidence behind every score.
 */
import { z } from "zod";

/** Where a piece of data came from. Attached to every material field. */
export const ProvenanceSchema = z.object({
  field: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  provider: z.string(), // "zero" | "unify" | "scaile" | "seed" | "inference" | ...
  sourceType: z.enum([
    "api_enrichment",
    "api_record",
    "intent_event",
    "curated_seed",
    "pattern_inference",
    "manual_entry",
  ]),
  sourceUrl: z.string().optional(),
  observed: z.boolean(), // true = directly observed, false = inferred
  verified: z.boolean(),
  confidence: z.number().min(0).max(1),
  retrievedAt: z.string(), // ISO
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

/** A single scoring signal with its supporting evidence. */
export const EvidenceSchema = z.object({
  ruleId: z.string(),
  axis: z.enum(["reach", "mission", "email_volume"]),
  signal: z.string(), // human label
  detail: z.string(), // what we actually found
  provider: z.string(),
  sourceUrl: z.string().optional(),
  observed: z.boolean(),
  confidence: z.number().min(0).max(1),
  points: z.number(), // contribution to the axis (post-weight)
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const TierSchema = z.enum(["A", "B", "C", "D"]);
export type Tier = z.infer<typeof TierSchema>;

export const ChampionScoreSchema = z.object({
  total: z.number().min(0).max(100),
  reachScore: z.number().min(0).max(100),
  missionScore: z.number().min(0).max(100),
  emailVolumeScore: z.number().min(0).max(100),
  tier: TierSchema,
  isChampion: z.boolean(),
  rationale: z.string(),
  evidence: z.array(EvidenceSchema),
});
export type ChampionScore = z.infer<typeof ChampionScoreSchema>;

export const CompanySchema = z.object({
  name: z.string(),
  domain: z.string().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z.number().optional(),
  linkedin: z.string().optional(),
  isAiNative: z.boolean().optional(),
  fundingStage: z.string().optional(),
});
export type Company = z.infer<typeof CompanySchema>;

/** Raw signals we collect about a person before scoring. */
export const ProspectSignalsSchema = z.object({
  xFollowers: z.number().optional(),
  linkedinFollowers: z.number().optional(),
  runsNewsletter: z.boolean().optional(),
  newsletterUrl: z.string().optional(),
  newsletterSubscribers: z.number().optional(),
  writesAboutTasteOrAiSlop: z.boolean().optional(),
  postsAboutBuildingAiStack: z.boolean().optional(),
  isThoughtLeader: z.boolean().optional(),
  isVcOrAccelerator: z.boolean().optional(),
  isAiEducator: z.boolean().optional(),
  worksInCommunityOrPartnerships: z.boolean().optional(),
  distinctVoice: z.boolean().optional(),
  podcastPresence: z.boolean().optional(),
  speakingAppearances: z.boolean().optional(),
});
export type ProspectSignals = z.infer<typeof ProspectSignalsSchema>;

/** A current trigger event that earns a timely, relevant outreach. */
export const IntentSignalSchema = z.object({
  type: z.enum([
    "funding",
    "product_launch",
    "senior_hire",
    "partnership",
    "market_expansion",
    "speaking",
    "recent_post",
    "website_visit",
  ]),
  summary: z.string(),
  occurredAt: z.string().optional(),
  provider: z.string(),
  sourceUrl: z.string().optional(),
  confidence: z.number().min(0).max(1),
});
export type IntentSignal = z.infer<typeof IntentSignalSchema>;

export const ContentEvidenceSchema = z.object({
  title: z.string(),
  kind: z.enum(["post", "newsletter", "article", "podcast", "talk"]),
  url: z.string().optional(),
  excerpt: z.string().optional(),
  themes: z.array(z.string()).default([]),
  provider: z.string(),
});
export type ContentEvidence = z.infer<typeof ContentEvidenceSchema>;

export const ContactRouteSchema = z.object({
  channel: z.enum(["email", "linkedin", "x", "newsletter_reply", "warm_intro"]),
  value: z.string().optional(),
  verified: z.boolean(),
  confidence: z.number().min(0).max(1),
  provider: z.string(),
});
export type ContactRoute = z.infer<typeof ContactRouteSchema>;

export const ChannelRecommendationSchema = z.object({
  primary: z.string(),
  secondary: z.string().optional(),
  timing: z.string(),
  reason: z.string(),
});
export type ChannelRecommendation = z.infer<typeof ChannelRecommendationSchema>;

/** The human-reviewable personalization brief produced per approved prospect. */
export const PersonalizationBriefSchema = z.object({
  triggerEvent: z.string().optional(),
  valueProp: z.string(),
  hook: z.string(),
  cta: z.string(),
  warmIntroPath: z.string().optional(),
  draftOpener: z.string(),
  evidence: z.array(z.string()),
  generatedBy: z.string(), // "llm:claude" | "rules"
});
export type PersonalizationBrief = z.infer<typeof PersonalizationBriefSchema>;

export const ProspectStatusSchema = z.enum([
  "discovered",
  "qualified",
  "enriched",
  "outreach_ready",
  "approved",
  "rejected",
  "synced",
]);
export type ProspectStatus = z.infer<typeof ProspectStatusSchema>;

export const UnifiedProspectSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string().optional(),
  company: CompanySchema,
  location: z.string().optional(),
  linkedin: z.string().optional(),
  x: z.string().optional(),
  website: z.string().optional(),
  signals: ProspectSignalsSchema,
  intent: z.array(IntentSignalSchema).default([]),
  content: z.array(ContentEvidenceSchema).default([]),
  contactRoutes: z.array(ContactRouteSchema).default([]),
  score: ChampionScoreSchema,
  channel: ChannelRecommendationSchema,
  personalization: PersonalizationBriefSchema.optional(),
  status: ProspectStatusSchema,
  provenance: z.array(ProvenanceSchema).default([]),
  // provider-specific ids, populated on enrich/sync
  zeroContactId: z.string().optional(),
  zeroCompanyId: z.string().optional(),
  zeroDealId: z.string().optional(),
  unifyPersonId: z.string().optional(),
});
export type UnifiedProspect = z.infer<typeof UnifiedProspectSchema>;

/** Cost / rate-limit ledger entry — tracked for every provider operation. */
export type CostLedgerEntry = {
  provider: string;
  operation: string;
  timestamp: string;
  success: boolean;
  creditsConsumed?: number;
  estCostUsd?: number;
  cacheStatus: "hit" | "miss" | "n/a";
  retryCount: number;
  note?: string;
};

export type ProviderStatus = {
  provider: "unify" | "zero" | "scaile";
  state:
    | "connected"
    | "read_only"
    | "auth_failed"
    | "not_configured"
    | "rate_limited"
    | "unreachable";
  capabilities: { read: boolean; write: boolean };
  supportedFunctions: string[];
  lastChecked: string;
  detail?: string;
};
