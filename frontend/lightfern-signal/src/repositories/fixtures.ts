import { ApprovedProspect, EvidenceRecord } from "@/src/contracts/outreach";

const evidence = (
  id: string, title: string, excerpt: string, category: EvidenceRecord["category"],
  confidence = 92, mode: EvidenceRecord["mode"] = "observed",
): EvidenceRecord => ({
  id, title, excerpt, category, confidence, mode,
  url: `https://example.com/lightfern-demo/${id}`,
  publishedAt: "2026-05-14T09:00:00.000Z",
  capturedAt: "2026-06-20T09:00:00.000Z",
  permittedForOutreach: true,
});

const base = {
  demo: true,
  profiles: { linkedin: "https://linkedin.com", x: "https://x.com" },
  restrictions: { optOut: false, duplicate: false, directCompetitor: false, existingOutreach: false, unsupportedPersonalClaim: false },
  approvalStatus: "approved" as const,
};

export const fixtureProspects: ApprovedProspect[] = [
  {
    ...base, id: "maya-chen", identity: { name: "Maya Chen", role: "Co-founder & CEO", location: "London, UK" },
    company: { name: "Common Thread", domain: "commonthread.ai", type: "AI collaboration", size: "18", fundingStage: "Seed" },
    championScore: 91, confidenceScore: 94, tier: "A",
    categoryScores: { need: 91, voice: 96, mission: 94, reach: 84, timing: 87, access: 89 },
    profiles: { ...base.profiles, newsletter: "https://example.com/the-thread" },
    contact: { email: "maya@commonthread.ai", emailVerified: true, route: "Verified work email" },
    evidence: [
      evidence("ev-maya-1", "The texture problem", "When every assistant reaches for the same polished cadence, useful writing loses its texture.", "voice", 98),
      evidence("ev-maya-2", "Designing collaboration without sameness", "The goal is not consensus. It is making disagreement legible enough to work with.", "mission", 95),
      evidence("ev-maya-3", "Seed announcement", "Common Thread raised a seed round to build tools for higher-quality distributed collaboration.", "trigger", 99),
    ],
    triggers: [{ id: "tr-maya", label: "Seed round announced", date: "2026-05-29", strength: 91, evidenceId: "ev-maya-3" }],
    personalisationBrief: "Lead with her critique of polished sameness; connect Lightfern to preserving texture without making a psychological claim.",
    providerIds: { unify: "uni_maya", zero: "zero_maya", scaile: "scaile_maya" },
  },
  {
    ...base, id: "jon-bell", identity: { name: "Jon Bell", role: "Founder", location: "Bristol, UK" },
    company: { name: "Tidework", domain: "tidework.co", type: "Climate operations", size: "31", fundingStage: "Series A" },
    championScore: 88, confidenceScore: 91, tier: "A",
    profiles: { ...base.profiles, newsletter: "https://example.com/low-tide" },
    categoryScores: { need: 84, voice: 97, mission: 90, reach: 88, timing: 76, access: 82 },
    contact: { email: "jon@tidework.co", emailVerified: true, route: "Newsletter reply + work email" },
    evidence: [
      evidence("ev-jon-1", "Low Tide #48 — Small systems", "Fish notice the river before the board notices the dashboard. Small environmental changes reshape the whole ecosystem.", "voice", 97),
      evidence("ev-jon-2", "Writing in public for six years", "A founder newsletter with 18,000 subscribers and a consistent weekly cadence.", "reach", 94),
    ],
    triggers: [], personalisationBrief: "Reference the fish/ecosystem argument precisely, then bridge to small amounts of generic AI flattening communication.",
    providerIds: { unify: "uni_jon", zero: "zero_jon" },
  },
  {
    ...base, id: "amina-yusuf", identity: { name: "Amina Yusuf", role: "Founder & CEO", location: "Manchester, UK" },
    company: { name: "Lattice Health", domain: "latticehealth.io", type: "Health infrastructure", size: "44", fundingStage: "Series A" },
    championScore: 86, confidenceScore: 93, tier: "A",
    categoryScores: { need: 89, voice: 78, mission: 94, reach: 80, timing: 98, access: 77 },
    contact: { email: "amina@latticehealth.io", emailVerified: true, route: "Verified work email" },
    evidence: [
      evidence("ev-amina-1", "Series A announcement", "Lattice Health raised £8m to expand its clinical operations platform.", "trigger", 99),
      evidence("ev-amina-2", "Founder note on trust", "Infrastructure earns trust through hundreds of small, boring decisions made consistently.", "mission", 91),
    ],
    triggers: [{ id: "tr-amina", label: "Series A announced", date: "2026-06-04", strength: 97, evidenceId: "ev-amina-1" }],
    personalisationBrief: "Use the recent funding trigger and her trust-through-small-decisions framing.",
    providerIds: { unify: "uni_am", zero: "zero_am", scaile: "scaile_am" },
  },
  {
    ...base, id: "theo-grant", identity: { name: "Theo Grant", role: "Co-founder", location: "Edinburgh, UK" },
    company: { name: "Northstar Labs", domain: "northstarlabs.dev", type: "Developer tools", size: "12", fundingStage: "Pre-seed" },
    championScore: 84, confidenceScore: 90, tier: "A",
    categoryScores: { need: 82, voice: 88, mission: 85, reach: 72, timing: 81, access: 99 },
    contact: { email: "theo@northstarlabs.dev", emailVerified: true, route: "Warm introduction" },
    evidence: [evidence("ev-theo-1", "Build notes", "Good developer tools remove ceremony without removing judgment.", "voice", 92), evidence("ev-theo-2", "Shared portfolio", "Theo and Lightfern adviser Nia Patel are both in the Pioneer North portfolio.", "relationship", 98)],
    triggers: [], personalisationBrief: "Ask Nia Patel for a concise introduction around preserving judgment in AI-assisted communication.",
    warmIntroduction: { via: "Nia Patel", strength: 96, context: "Shared Pioneer North portfolio; worked together at portfolio office hours." },
    providerIds: { unify: "uni_theo", zero: "zero_theo" },
  },
  {
    ...base, id: "lucas-reed", identity: { name: "Lucas Reed", role: "Founder", location: "New York, US" },
    company: { name: "Reachworks", domain: "reachworks.com", type: "Creator analytics", size: "76", fundingStage: "Series B" },
    championScore: 69, confidenceScore: 89, tier: "B",
    categoryScores: { need: 60, voice: 82, mission: 41, reach: 99, timing: 72, access: 83 },
    contact: { email: "lucas@reachworks.com", emailVerified: true, route: "Verified work email" },
    evidence: [evidence("ev-lucas-1", "Distribution at scale", "Lucas reaches more than 240,000 operators across social channels.", "reach", 96), evidence("ev-lucas-2", "Automation thesis", "Consistency matters more than preserving individual style at scale.", "mission", 90)],
    triggers: [], personalisationBrief: "Strong reach, but weak mission alignment. Do not prioritise without stronger product need.",
    providerIds: { unify: "uni_lucas", zero: "zero_lucas" },
  },
  {
    ...base, id: "priya-nair", identity: { name: "Priya Nair", role: "Founder", location: "Cambridge, UK" },
    company: { name: "Field Notes", domain: "fieldnotes.studio", type: "Research software", size: "9", fundingStage: "Bootstrapped" },
    championScore: 82, confidenceScore: 54, tier: "B",
    categoryScores: { need: 87, voice: 91, mission: 88, reach: 63, timing: 69, access: 55 },
    contact: { email: "priya@fieldnotes.studio", emailVerified: false, route: "Unverified inferred email" },
    evidence: [evidence("ev-priya-1", "Quoted conference notes", "A second-hand conference note attributes a strong critique of generic research summaries to Priya.", "voice", 54, "inferred")],
    triggers: [], personalisationBrief: "High potential but insufficient primary research. Research further before outreach.",
    providerIds: { unify: "uni_priya" },
  },
];
