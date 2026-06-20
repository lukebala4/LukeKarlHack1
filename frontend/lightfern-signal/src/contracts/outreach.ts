export type Provider = "unify" | "zero" | "scaile" | "internal";
export type EvidenceMode = "observed" | "inferred";
export type ProspectTier = "A" | "B" | "C";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "suppressed";

export interface EvidenceRecord {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  publishedAt: string;
  capturedAt: string;
  confidence: number;
  mode: EvidenceMode;
  category: "voice" | "mission" | "reach" | "trigger" | "company" | "relationship";
  permittedForOutreach: boolean;
}

export interface ApprovedProspect {
  id: string;
  demo: boolean;
  identity: { name: string; role: string; avatar?: string; location: string };
  company: { name: string; domain: string; type: string; size: string; fundingStage: string };
  championScore: number;
  confidenceScore: number;
  categoryScores: Record<"need" | "voice" | "mission" | "reach" | "timing" | "access", number>;
  tier: ProspectTier;
  profiles: { linkedin?: string; x?: string; newsletter?: string };
  contact: { email?: string; emailVerified: boolean; route: string };
  evidence: EvidenceRecord[];
  triggers: { id: string; label: string; date: string; strength: number; evidenceId: string }[];
  personalisationBrief: string;
  warmIntroduction?: { via: string; strength: number; context: string };
  providerIds: Partial<Record<Provider, string>>;
  restrictions: {
    optOut: boolean;
    duplicate: boolean;
    directCompetitor: boolean;
    existingOutreach: boolean;
    unsupportedPersonalClaim: boolean;
  };
  approvalStatus: ApprovalStatus;
}

export type OutreachPlay =
  | "Warm Introduction"
  | "Research-Led Personalised Email"
  | "Newsletter-Led Outreach"
  | "Founder Voice Benchmark"
  | "Personalised Demonstration Page"
  | "Founder Cohort Invitation"
  | "Event-Triggered Outreach"
  | "Company-Trigger Outreach"
  | "Existing-User Referral"
  | "VC or Accelerator Portfolio Pilot";

export interface OutreachReadiness {
  score: number;
  components: Record<"contact" | "evidence" | "trigger" | "channel" | "cta" | "confidence", number>;
  penalties: { label: string; value: number }[];
  blocked: boolean;
  blockers: string[];
}

export interface PersonalisedClaim {
  id: string;
  sentence: string;
  evidenceId: string;
}

export interface EmailDraft {
  id: string;
  prospectId: string;
  subjectOptions: string[];
  openings: string[];
  recommendedOpening: number;
  body: string;
  alternativeAngle: string;
  cta: string;
  timing: string;
  followUps: string[];
  claims: PersonalisedClaim[];
  createdAt: string;
}

export type PipelineEventType =
  | "job.started" | "provider.connected" | "provider.searching" | "company.discovered"
  | "founder.discovered" | "prospect.enriching" | "evidence.found" | "trigger.found"
  | "score.calculating" | "score.completed" | "prospect.ready_for_review"
  | "prospect.approved" | "prospect.sent_to_outreach" | "outreach_readiness.calculating"
  | "outreach_play.selected" | "personalisation.preparing" | "email.draft_created"
  | "asset.created" | "outreach.ready_for_approval" | "provider.syncing"
  | "provider.synced" | "trial.started" | "trial.completed" | "referral.created"
  | "champion.created" | "job.completed" | "job.failed";

export interface ProspectPipelineEvent {
  id: string;
  jobId: string;
  type: PipelineEventType;
  timestamp: string;
  provider: Provider;
  prospectId?: string;
  message: string;
  demo: boolean;
  payload: Record<string, unknown>;
}

export interface ApprovedProspectRepository {
  listApprovedProspects(): Promise<ApprovedProspect[]>;
  getApprovedProspect(prospectId: string): Promise<ApprovedProspect | null>;
  subscribeToProspectEvents?(jobId: string): AsyncIterable<ProspectPipelineEvent>;
  markOutreachPrepared(prospectId: string, outreachId: string): Promise<void>;
}
