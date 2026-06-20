/**
 * Curated ICP discovery layer — the "AccountDiscoveryProvider" of this build.
 *
 * Neither Unify's nor Zero's API performs external web discovery (verified against
 * their specs), so net-new sourcing is a curated/CSV layer. This is REPRESENTATIVE
 * ICP data for AI-native B2B SaaS GTM/commercial champions, deliberately spanning the
 * champion quadrant (high/high, high-reach/low-taste, high-taste/low-reach, low/low)
 * so the scoring engine demonstrably separates true champions from mere megaphones.
 *
 * Every field is stamped sourceType:"curated_seed" in provenance. Swap this module for
 * a live feed (Clay/Exa/PhantomBuster/CSV) without touching the pipeline contract.
 */
import type { ProspectSignals } from "@/lib/types";

export type RawSeed = {
  name: string;
  title: string;
  companyName: string;
  domain?: string;
  isAiNative?: boolean;
  fundingStage?: string;
  linkedin?: string;
  x?: string;
  website?: string;
  location?: string;
  emailPattern?: string; // e.g. "first.last" -> first.last@domain (pattern_inference, unverified)
  // Live-source fields (e.g. Clay): when present, treated as verified/observed, not inferred.
  source?: string; // "clay" | undefined(=curated_seed)
  verifiedEmail?: string; // real, provider-verified email
  signals: ProspectSignals;
  intent?: { type: any; summary: string; sourceUrl?: string; occurredAt?: string }[];
  content?: { title: string; kind: any; themes: string[]; url?: string; excerpt?: string }[];
};

export const SEED: RawSeed[] = [
  {
    name: "Maya Ellison", title: "Founder & CEO", companyName: "Cadence AI", domain: "cadence.ai",
    isAiNative: true, fundingStage: "Series A", x: "https://x.com/mayawrites", website: "https://mayaellison.substack.com",
    location: "London, UK", emailPattern: "first",
    signals: { xFollowers: 84000, runsNewsletter: true, newsletterUrl: "https://mayaellison.substack.com", newsletterSubscribers: 31000, writesAboutTasteOrAiSlop: true, distinctVoice: true, postsAboutBuildingAiStack: true, isThoughtLeader: true, isAiEducator: true },
    intent: [{ type: "recent_post", summary: "Viral thread: 'The em-dash apocalypse — why all AI writing reads the same'", sourceUrl: "https://x.com/mayawrites/status/1" }],
    content: [{ title: "In praise of the unoptimised sentence", kind: "newsletter", themes: ["taste", "ai-slop", "craft"], url: "https://mayaellison.substack.com/p/unoptimised" }],
  },
  {
    name: "Daniel Okafor", title: "General Partner", companyName: "Northwind Ventures", domain: "northwind.vc",
    isAiNative: false, x: "https://x.com/dokafor", website: "https://danielokafor.com", location: "London, UK", emailPattern: "first",
    signals: { xFollowers: 62000, isVcOrAccelerator: true, runsNewsletter: true, newsletterSubscribers: 18000, newsletterUrl: "https://danielokafor.com/notes", writesAboutTasteOrAiSlop: true, distinctVoice: true, isThoughtLeader: true, speakingAppearances: true },
    intent: [{ type: "speaking", summary: "Keynote at SaaStr Europe on 'authentic founder comms' next month" }],
    content: [{ title: "Why your portfolio's outbound all sounds the same", kind: "post", themes: ["ai-slop", "gtm", "taste"] }],
  },
  {
    name: "Priya Raman", title: "Head of Growth", companyName: "Loopwork", domain: "loopwork.io",
    isAiNative: true, fundingStage: "Seed", linkedin: "https://linkedin.com/in/priyaraman", x: "https://x.com/priyagrows",
    location: "Berlin, DE", emailPattern: "first.last",
    signals: { xFollowers: 12000, linkedinFollowers: 28000, runsNewsletter: true, newsletterSubscribers: 6500, newsletterUrl: "https://loopnotes.substack.com", postsAboutBuildingAiStack: true, writesAboutTasteOrAiSlop: true, worksInCommunityOrPartnerships: true, distinctVoice: true },
    intent: [{ type: "senior_hire", summary: "Loopwork just hired a VP Sales — scaling outbound now" }, { type: "recent_post", summary: "Post: 'Our GTM stack, tool by tool' (high AI-stack signal)" }],
    content: [{ title: "The GTM stack we actually use", kind: "newsletter", themes: ["ai-stack", "gtm", "tooling"] }],
  },
  {
    name: "Tom Bright", title: "Co-founder & CRO", companyName: "Vexa", domain: "vexa.com",
    isAiNative: true, fundingStage: "Series B", linkedin: "https://linkedin.com/in/tombright", x: "https://x.com/tombright",
    location: "San Francisco, US", emailPattern: "first",
    signals: { xFollowers: 145000, linkedinFollowers: 41000, isThoughtLeader: true, speakingAppearances: true, podcastPresence: true, distinctVoice: false, worksInCommunityOrPartnerships: true },
    intent: [{ type: "funding", summary: "Vexa raised $40M Series B two weeks ago — hiring 20 AEs" }],
    content: [{ title: "Scaling outbound to 100 reps", kind: "podcast", themes: ["outbound", "scale"] }],
  },
  {
    name: "Sofia Marchetti", title: "Writer & AI Educator", companyName: "The Long Sentence", domain: "thelongsentence.com",
    isAiNative: false, website: "https://thelongsentence.com", x: "https://x.com/sofiawrites", location: "Lisbon, PT", emailPattern: "first",
    signals: { xFollowers: 9000, runsNewsletter: true, newsletterSubscribers: 41000, newsletterUrl: "https://thelongsentence.com", writesAboutTasteOrAiSlop: true, distinctVoice: true, isAiEducator: true, postsAboutBuildingAiStack: true },
    intent: [{ type: "recent_post", summary: "Essay: 'Taste is the last moat' — 2k shares" }],
    content: [{ title: "Taste is the last moat", kind: "article", themes: ["taste", "ai-slop", "craft", "voice"] }],
  },
  {
    name: "Raj Patel", title: "Head of Partnerships", companyName: "Streamline", domain: "streamline.so",
    isAiNative: true, fundingStage: "Series A", linkedin: "https://linkedin.com/in/rajpatel", location: "London, UK", emailPattern: "first.last",
    signals: { linkedinFollowers: 22000, worksInCommunityOrPartnerships: true, isThoughtLeader: false, distinctVoice: false, postsAboutBuildingAiStack: true },
    intent: [{ type: "partnership", summary: "Announced integration partnership with a major CRM last week" }],
    content: [{ title: "Building a partner ecosystem from zero", kind: "post", themes: ["partnerships", "gtm"] }],
  },
  {
    name: "Elena Voss", title: "Founder", companyName: "Margins", domain: "margins.so",
    isAiNative: true, fundingStage: "Pre-seed", x: "https://x.com/elenavoss", website: "https://margins.so/blog",
    location: "Amsterdam, NL", emailPattern: "first",
    signals: { xFollowers: 5400, runsNewsletter: true, newsletterSubscribers: 3200, newsletterUrl: "https://margins.so/blog", writesAboutTasteOrAiSlop: true, distinctVoice: true, postsAboutBuildingAiStack: true },
    content: [{ title: "Writing software with a voice", kind: "newsletter", themes: ["taste", "craft", "product"] }],
  },
  {
    name: "Marcus Hale", title: "VP Sales", companyName: "Gridline", domain: "gridline.com",
    isAiNative: false, linkedin: "https://linkedin.com/in/marcushale", location: "New York, US", emailPattern: "first.last",
    signals: { linkedinFollowers: 8000, distinctVoice: false, worksInCommunityOrPartnerships: false },
    intent: [{ type: "senior_hire", summary: "Joined Gridline 3 weeks ago to build the sales motion" }],
    content: [],
  },
  {
    name: "Hannah Cole", title: "Accelerator Director", companyName: "Forge Labs", domain: "forgelabs.co",
    isAiNative: false, linkedin: "https://linkedin.com/in/hannahcole", x: "https://x.com/hannahcole", location: "London, UK", emailPattern: "first",
    signals: { xFollowers: 38000, linkedinFollowers: 30000, isVcOrAccelerator: true, worksInCommunityOrPartnerships: true, isThoughtLeader: true, speakingAppearances: true, runsNewsletter: true, newsletterSubscribers: 12000, writesAboutTasteOrAiSlop: false, distinctVoice: true },
    intent: [{ type: "recent_post", summary: "Announced new AI-native cohort — 30 founders onboarding" }],
    content: [{ title: "What this cohort gets wrong about distribution", kind: "newsletter", themes: ["gtm", "founders", "community"] }],
  },
  {
    name: "Liam Walsh", title: "Account Executive", companyName: "Beacon", domain: "beacon.so",
    isAiNative: true, fundingStage: "Seed", linkedin: "https://linkedin.com/in/liamwalsh", location: "Dublin, IE", emailPattern: "first.last",
    signals: { linkedinFollowers: 3500, distinctVoice: false },
    content: [],
  },
  {
    name: "Aisha Bello", title: "Founder & CEO", companyName: "Verba", domain: "verba.ai",
    isAiNative: true, fundingStage: "Series A", x: "https://x.com/aishabello", website: "https://verba.ai/field-notes",
    location: "London, UK", emailPattern: "first",
    signals: { xFollowers: 51000, runsNewsletter: true, newsletterSubscribers: 22000, newsletterUrl: "https://verba.ai/field-notes", writesAboutTasteOrAiSlop: true, distinctVoice: true, postsAboutBuildingAiStack: true, isThoughtLeader: true, isAiEducator: true, speakingAppearances: true },
    intent: [{ type: "product_launch", summary: "Launched a voice-preserving writing feature — directly mission-adjacent" }, { type: "recent_post", summary: "Thread on why reply rates collapsed in 2025" }],
    content: [{ title: "The reply-rate collapse and how to escape it", kind: "newsletter", themes: ["outbound", "ai-slop", "voice", "gtm"] }],
  },
  {
    name: "Greg Nolan", title: "Sales Operations Lead", companyName: "Tessellate", domain: "tessellate.io",
    isAiNative: false, linkedin: "https://linkedin.com/in/gregnolan", location: "Manchester, UK", emailPattern: "first.last",
    signals: { linkedinFollowers: 1500, distinctVoice: false },
    content: [],
  },
];
