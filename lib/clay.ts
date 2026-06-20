/**
 * LIVE Clay-sourced prospects — real people, real enrichment.
 *
 * Pulled and enriched through the user's connected Clay workspace (MCP):
 *   • base search: find-and-enrich-contacts-at-company (writer.com, GTM/founder titles)
 *   • enrichment: Email + Find Thought Leadership (real, verified)
 *
 * Unlike lib/seed.ts (curated/representative), these records carry provider:"clay",
 * sourceType:"api_enrichment", verified emails, and real thought-leadership evidence.
 * Signals below are derived directly from the Clay thought-leadership findings.
 *
 * WRITER — writer.com · AI writing platform · 582 employees · $250M+ raised · $500M–1B revenue
 * Investors: ICONIQ Growth, Insight Partners, Salesforce Ventures, Adobe Ventures, IBM Ventures…
 */
import type { RawSeed } from "@/lib/seed";

const WRITER = {
  companyName: "Writer",
  domain: "writer.com",
  isAiNative: true,
  fundingStage: "$250M+ raised",
  location: undefined as string | undefined,
};

export const CLAY: RawSeed[] = [
  {
    ...WRITER,
    name: "Diego Lomanto",
    title: "Chief Marketing Officer",
    location: "New York, US",
    linkedin: "https://www.linkedin.com/in/diego-lomanto-756301/",
    source: "clay",
    verifiedEmail: "diego.lomanto@writer.com",
    // Mission-aligned: explicitly champions staying *human* in the age of AI — Lightfern's thesis.
    signals: {
      isThoughtLeader: true,
      speakingAppearances: true,
      podcastPresence: true,
      distinctVoice: true,
      writesAboutTasteOrAiSlop: true,
      postsAboutBuildingAiStack: true,
      isAiEducator: true,
    },
    intent: [{ type: "recent_post", summary: "Talk: 'How marketers should become more human in the age of AI'", sourceUrl: "https://www.youtube.com/watch?v=LiebjQH5yjs" }],
    content: [
      { title: "How marketers should become more human in the age of AI", kind: "talk", themes: ["taste", "voice", "ai-slop", "marketing"], url: "https://www.youtube.com/watch?v=LiebjQH5yjs" },
      { title: "Diego Lomanto on AI marketing and the agentic future", kind: "article", themes: ["ai-stack", "marketing"], url: "https://writer.com/blog/humans-of-ai-diego-lomanto/" },
      { title: "Beat the Hype — How to Market AI", kind: "podcast", themes: ["ai-slop", "storytelling"], url: "https://next-gen-builders.simplecast.com/episodes/beat-the-hypehow-to-market-ai-with-diego-lomanto-from-writer-7mOWyQEG" },
    ],
  },
  {
    ...WRITER,
    name: "May Habib",
    title: "Co-founder & CEO",
    location: "San Francisco, US",
    linkedin: "https://www.linkedin.com/in/may-habib/",
    source: "clay",
    verifiedEmail: "may@writer.com",
    signals: {
      isThoughtLeader: true,
      speakingAppearances: true,
      podcastPresence: true,
      distinctVoice: true,
      isAiEducator: true,
      postsAboutBuildingAiStack: true,
    },
    intent: [{ type: "recent_post", summary: "First Round Review podcast: scaling & selling AI products for enterprise", sourceUrl: "https://review.firstround.com/podcast/scaling-and-selling-ai-products-for-enterprise-may-habib-co-founder-and-ceo-of-writer/" }],
    content: [
      { title: "Scaling and selling AI products for enterprise", kind: "podcast", themes: ["enterprise-ai", "gtm"], url: "https://review.firstround.com/podcast/scaling-and-selling-ai-products-for-enterprise-may-habib-co-founder-and-ceo-of-writer/" },
      { title: "Humans of AI: May Habib", kind: "article", themes: ["ai", "voice"], url: "https://writer.com/blog/humans-of-ai-may-habib/" },
    ],
  },
  {
    ...WRITER,
    name: "Alex Wettreich",
    title: "Head of Sales",
    location: "Austin, US",
    linkedin: "https://www.linkedin.com/in/alex-wettreich-08493/",
    source: "clay",
    verifiedEmail: "alex.wettreich@writer.com",
    signals: {
      isThoughtLeader: true,
      speakingAppearances: true,
      postsAboutBuildingAiStack: true,
      worksInCommunityOrPartnerships: true,
    },
    intent: [{ type: "speaking", summary: "Featured speaker at GTM2023 (Pavilion)", sourceUrl: "https://events.joinpavilion.com/gtm2023" }],
    content: [
      { title: "Product, customer, and story-led growth", kind: "newsletter", themes: ["gtm", "growth"], url: "https://thegtmnewsletter.substack.com/p/product-customer-and-story-led-growth" },
    ],
  },
];
