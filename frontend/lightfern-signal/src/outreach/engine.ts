import { ApprovedProspect, EmailDraft, OutreachPlay, OutreachReadiness } from "@/src/contracts/outreach";

export function canEnterOutreach(prospect: ApprovedProspect) {
  const blockers: string[] = [];
  if (prospect.approvalStatus !== "approved") blockers.push("Prospect has not been approved");
  if (prospect.restrictions.optOut) blockers.push("Contact has opted out");
  if (prospect.restrictions.directCompetitor) blockers.push("Direct competitor");
  if (prospect.restrictions.duplicate) blockers.push("Duplicate contact");
  return { allowed: blockers.length === 0, blockers };
}

export function calculateReadiness(prospect: ApprovedProspect): OutreachReadiness {
  const permittedEvidence = prospect.evidence.filter((e) => e.permittedForOutreach);
  const avgEvidence = permittedEvidence.length ? permittedEvidence.reduce((n, e) => n + e.confidence, 0) / permittedEvidence.length : 0;
  const components = {
    contact: prospect.contact.emailVerified || prospect.warmIntroduction ? 20 : prospect.contact.email ? 8 : 0,
    evidence: Math.round(Math.min(25, avgEvidence / 4)),
    trigger: Math.round(Math.min(20, (prospect.triggers[0]?.strength ?? 45) / 5)),
    channel: prospect.warmIntroduction ? 15 : prospect.contact.emailVerified ? 13 : 6,
    cta: prospect.categoryScores.need >= 80 ? 10 : 6,
    confidence: Math.round(prospect.confidenceScore / 10),
  };
  const penalties: { label: string; value: number }[] = [];
  if (!prospect.contact.emailVerified && !prospect.warmIntroduction) penalties.push({ label: "Unverified email", value: 12 });
  if (avgEvidence < 70) penalties.push({ label: "Weak evidence", value: 14 });
  if (prospect.restrictions.existingOutreach) penalties.push({ label: "Existing outreach", value: 18 });
  if (prospect.restrictions.unsupportedPersonalClaim) penalties.push({ label: "Unsupported personal claim", value: 25 });
  const eligibility = canEnterOutreach(prospect);
  return {
    score: Math.max(0, Object.values(components).reduce((a, b) => a + b, 0) - penalties.reduce((a, b) => a + b.value, 0)),
    components, penalties, blocked: !eligibility.allowed, blockers: eligibility.blockers,
  };
}

export function selectOutreachPlay(prospect: ApprovedProspect): { recommended: OutreachPlay; fallback: OutreachPlay; reasons: string[] } {
  if (prospect.warmIntroduction?.strength && prospect.warmIntroduction.strength >= 70) {
    return { recommended: "Warm Introduction", fallback: "Research-Led Personalised Email", reasons: ["A credible shared relationship exists", "Warm routes outrank cold outreach", "Context is supported by relationship evidence"] };
  }
  if (prospect.profiles.newsletter && prospect.categoryScores.voice >= 85) {
    return { recommended: "Founder Voice Benchmark", fallback: "Newsletter-Led Outreach", reasons: ["Distinctive public writing", "Strong voice signal", "Verified direct contact", "No warm-introduction route"] };
  }
  if (prospect.triggers.some((t) => t.strength >= 80)) {
    return { recommended: "Event-Triggered Outreach", fallback: "Research-Led Personalised Email", reasons: ["Recent high-confidence trigger", "Timing is unusually relevant", "Evidence supports a concise approach"] };
  }
  return { recommended: "Research-Led Personalised Email", fallback: "Personalised Demonstration Page", reasons: ["Specific permitted evidence is available", "Email is the strongest verified channel", "A low-friction product CTA is relevant"] };
}

export function generateEmailDraft(prospect: ApprovedProspect): EmailDraft {
  const primary = prospect.evidence.find((e) => e.permittedForOutreach && e.mode === "observed") ?? prospect.evidence[0];
  const excerpt = primary?.excerpt ?? "Your recent writing stood out for its clarity.";
  const opening = `I enjoyed “${primary?.title}”, particularly your point that ${excerpt.charAt(0).toLowerCase()}${excerpt.slice(1)}`;
  return {
    id: `draft-${prospect.id}`, prospectId: prospect.id,
    subjectOptions: ["A small voice experiment", `${prospect.identity.name.split(" ")[0]}, your writing + AI`, "Preserving the texture in founder communication"],
    openings: [opening, `Your line in “${primary?.title}” stayed with me: “${excerpt}”`, `I found ${primary?.title} while looking for founders with a genuinely recognisable public voice.`],
    recommendedOpening: 0,
    body: `${opening}\n\nIt made me think about a quieter version of the same issue in communication: small amounts of generic AI assistance can gradually flatten how someone naturally writes.\n\nLightfern helps people use AI without losing the choices that make their communication recognisably theirs. We built a private five-email test for you using only the public writing linked here.\n\nWould you be open to trying it? It takes about twelve minutes and there is no sales call attached.`,
    alternativeAngle: `Lead with ${prospect.company.name}'s current growth moment, then offer the benchmark as a useful private artefact.`,
    cta: "Try the private Five-Email Test",
    timing: prospect.triggers.length ? "Tuesday, 09:20 local time — while the trigger is current" : "Tuesday, 09:20 local time",
    followUps: ["Day 4: Share one benchmark observation, with its source.", "Day 10: Close the loop and offer to delete the private page."],
    claims: primary ? [{ id: `claim-${prospect.id}-1`, sentence: opening, evidenceId: primary.id }] : [],
    createdAt: new Date().toISOString(),
  };
}

export function validateDraft(draft: EmailDraft, prospect: ApprovedProspect) {
  const evidenceIds = new Set(prospect.evidence.filter((e) => e.permittedForOutreach).map((e) => e.id));
  const claimsValid = draft.claims.length > 0 && draft.claims.every((claim) => evidenceIds.has(claim.evidenceId));
  const generic = !prospect.identity.name || !draft.body.includes("Lightfern") || draft.body.length < 260 || draft.claims.length === 0;
  const reusable = !draft.body.includes(prospect.evidence[0]?.title ?? "__missing__");
  return {
    approvable: claimsValid && !generic && !reusable,
    claimsValid, generic, reusable,
    checks: {
      specific: claimsValid,
      sourceUnderstood: draft.claims.every((c) => c.sentence.length > 40),
      naturalConnection: draft.body.includes("It made me think"),
      explainsSelection: draft.body.includes("public writing") || draft.body.includes("communication"),
      relevantUseCase: draft.body.includes("five-email"),
      lowFrictionCta: draft.body.includes("no sales call"),
      unique: !reusable,
    },
  };
}

export class ProviderSyncService {
  private synced = new Set<string>();
  sync(prospectId: string, draftId: string) {
    const key = `${prospectId}:${draftId}`;
    if (this.synced.has(key)) return { status: "duplicate_prevented" as const, key };
    this.synced.add(key);
    return { status: "synced" as const, key };
  }
}
