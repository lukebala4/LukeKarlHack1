/**
 * Live Clay-sourced + enriched candidate pool — 5 companies × 3 senior GTM people (15 total).
 * Sourced via the connected Clay MCP workspace (find-and-enrich-contacts-at-company) with
 * data points: Email, Phone Number, LinkedIn Engagement (+ company Latest Funding, Investors,
 * Headcount Growth). Every value here came back live from Clay.
 *
 * The enrichment workflow (lib/enrich.ts) writes each selected person into Unify (person record
 * incl. phone + EU-resident compliance) and Zero (CRM company + contact + deal), live and
 * idempotently. The "Enrich N people" control draws from this pool, N at a time.
 *
 * Refresh by running a Clay search through the MCP session and regenerating this file — the
 * workflow is provider-agnostic and always writes live to Unify + Zero.
 */

export type EnrichedCompany = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  employeeCount: number;
  annualRevenue: string;
  latestFunding: string;
  investors: string[];
  headcountNote?: string;
};

export type EnrichedContact = {
  companyId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  linkedinUrl: string;
  location: string;
  euResident: boolean;
  linkedinFollowers?: number;
  /** Recent public engagement / thought leadership (Clay "Find Thought Leadership"). */
  linkedinEngagement?: string;
  source: "clay";
};

export const ENRICHMENT_COMPANIES: EnrichedCompany[] = [
  { id: "cursor", name: "Cursor", domain: "cursor.com", industry: "Software Development", employeeCount: 995, annualRevenue: "$75M–200M", latestFunding: "$2,300,000,000", investors: ["Accel", "Andreessen Horowitz", "Benchmark", "DST", "Google", "NVIDIA", "Thrive Capital", "Toba Capital"], headcountNote: "326 → 995 employees (+205%) over 6 months" },
  { id: "clay", name: "Clay", domain: "clay.com", industry: "Software Development", employeeCount: 1367, annualRevenue: "$500M–1B", latestFunding: "$100,000,000", investors: ["Sequoia Capital", "First Round", "Boldstart Ventures", "Box Group"] },
  { id: "perplexity", name: "Perplexity", domain: "perplexity.ai", industry: "Software Development", employeeCount: 1414, annualRevenue: "$500M–1B", latestFunding: "$250M+ raised", investors: ["IVP", "NEA", "Jeff Bezos", "NVIDIA", "Databricks Ventures"] },
  { id: "vercel", name: "Vercel", domain: "vercel.com", industry: "Software Development", employeeCount: 935, annualRevenue: "$200M–500M", latestFunding: "$300,000,000", investors: ["Accel", "General Catalyst", "GV", "Khosla Ventures", "BlackRock", "GIC", "Notable Capital", "Schroders", "StepStone", "Adams Street Partners"] },
  { id: "linear", name: "Linear", domain: "linear.app", industry: "Software Development", employeeCount: 266, annualRevenue: "$75M–200M", latestFunding: "$82,000,000", investors: ["Accel", "Sequoia Capital", "01 Advisors", "Designer Fund"] },
];

export const ENRICHMENT_POOL: EnrichedContact[] = [
  // ── Cursor ──────────────────────────────────────────────────────────────
  { companyId: "cursor", profileId: "652651394", firstName: "Brian", lastName: "McCarthy", title: "President, Global Revenue and WW Field Operations", email: "brian@cursor.com", emailVerified: true, linkedinUrl: "https://www.linkedin.com/in/brian-mccarthy-686a142/", location: "Greater Philadelphia", euResident: false, linkedinFollowers: 8830, linkedinEngagement: "Recent: podcast 'Why Sales Execution Wins in an AI-First World' + YouTube 'Inside the Mind of a $4B+ Sales Leader'. 8,830 followers.", source: "clay" },
  { companyId: "cursor", profileId: "160479438", firstName: "Jason", lastName: "Yttre", title: "VP, Strategic Growth", email: "jason.yttre@cursor.sh", emailVerified: true, phone: "(630) 888-8864", linkedinUrl: "https://www.linkedin.com/in/jason-t-yttre-2175936/", location: "Greater Milwaukee", euResident: false, linkedinEngagement: "Seasoned software sales leader; prior roles at Rubrik, ThoughtSpot, Qlik.", source: "clay" },
  { companyId: "cursor", profileId: "354138401", firstName: "Benjamin", lastName: "Caller", title: "Head of Sales Southern Europe", email: "ben@cursor.com", emailVerified: true, phone: "+33 6 60 54 26 34", linkedinUrl: "https://www.linkedin.com/in/benjamincaller/", location: "Asnières-sur-Seine, Île-de-France, France", euResident: true, linkedinEngagement: "Recent: WMYT podcast on sales mindset + LinkedIn article 'The Roadmap to Partner Marketability'. Ex-GitLab/Zendesk/ThoughtSpot.", source: "clay" },

  // ── Clay ────────────────────────────────────────────────────────────────
  { companyId: "clay", profileId: "250145920", firstName: "Davide", lastName: "Grieco", title: "Head of Growth", email: "davide@clay.com", emailVerified: true, linkedinUrl: "https://www.linkedin.com/in/davidegrieco/", location: "San Francisco Bay Area", euResident: false, linkedinFollowers: 19192, linkedinEngagement: "Recent: 'On Growth #1' interview + Clay blog 'what does growth actually do?'. 19,192 followers.", source: "clay" },
  { companyId: "clay", profileId: "607164643", firstName: "Bruno", lastName: "Estrella", title: "Head of Marketing", email: "bruno.estrella@clay.com", emailVerified: true, linkedinUrl: "https://www.linkedin.com/in/bruno-estrella-146743a7/", location: "New York, New York, United States", euResident: false, linkedinEngagement: "Recent: 'The Clay Playbook' podcast + 'Is Outbound the Most Undervalued GTM Motion?'.", source: "clay" },
  { companyId: "clay", profileId: "656551271", firstName: "Becca", lastName: "Lindquist", title: "Head of Sales", email: "becca.lindquist@clay.com", emailVerified: true, linkedinUrl: "https://www.linkedin.com/in/becca-lindquist-7a3b0754/", location: "New York City Metropolitan Area", euResident: false, linkedinEngagement: "Recent: 20VC 'Inside Clay's Sales Playbook — Scaling to $100M ARR'.", source: "clay" },

  // ── Perplexity ──────────────────────────────────────────────────────────
  { companyId: "perplexity", profileId: "793054388", firstName: "Daniela", lastName: "Miranda-Smith", title: "Head of Partnerships", email: "daniela.miranda-smith@perplexity.ai", emailVerified: true, linkedinUrl: "https://www.linkedin.com/in/danielamirandasmith/", location: "Lisbon, Portugal", euResident: true, linkedinFollowers: 3200, linkedinEngagement: "3,200 followers; ~2 posts/week; reactions 👍 ❤️ with appreciative comments.", source: "clay" },
  { companyId: "perplexity", profileId: "436604048", firstName: "Robert", lastName: "Beringhaus", title: "Enterprise Growth Lead", email: "robert.beringhaus@perplexity.ai", emailVerified: true, linkedinUrl: "https://www.linkedin.com/in/robert-beringhaus-8a182312/", location: "New York City Metropolitan Area", euResident: false, linkedinFollowers: 8292, linkedinEngagement: "Active poster: Comet Browser launch, joining Perplexity, Odd Lots podcast. 8,292 followers.", source: "clay" },
  { companyId: "perplexity", profileId: "137426862", firstName: "Jenny", lastName: "Tsung", title: "Product Marketing Lead", email: "jenny@perplexity.ai", emailVerified: true, linkedinUrl: "https://www.linkedin.com/in/jennytsung/", location: "New York, New York, United States", euResident: false, linkedinFollowers: 11596, linkedinEngagement: "11,596 followers; ~0.5 posts/week; reactions 👍 ❤️ with positive comments.", source: "clay" },

  // ── Vercel ──────────────────────────────────────────────────────────────
  { companyId: "vercel", profileId: "578941589", firstName: "Nick", lastName: "Bogaty", title: "Chief Revenue Officer", email: "nick.bogaty@vercel.co", emailVerified: true, linkedinUrl: "https://www.linkedin.com/in/nbogaty/", location: "San Francisco, California, United States", euResident: false, linkedinFollowers: 8878, linkedinEngagement: "Recent: Vercel CRO announcement + Hard Skill Exchange fireside on AI-native GTM. 8,878 followers.", source: "clay" },
  { companyId: "vercel", profileId: "133366429", firstName: "Keith", lastName: "Messick", title: "Chief Marketing Officer", email: "keith.messick@vercel.com", emailVerified: true, linkedinUrl: "https://www.linkedin.com/in/keith-messick-3b024b2/", location: "San Francisco, California, United States", euResident: false, linkedinFollowers: 1132, linkedinEngagement: "Recent: Dreamforce 'Commerce Innovators' podcast on composability + AI. Vercel CMO.", source: "clay" },
  { companyId: "vercel", profileId: "581306511", firstName: "Austin", lastName: "Brizgys", title: "VP of Sales, Startups", email: "austin.brizgys@vercel.com", emailVerified: true, phone: "+1 956-997-2058", linkedinUrl: "https://www.linkedin.com/in/austin-brizgys-8a30641b/", location: "Mountain View, California, United States", euResident: false, linkedinFollowers: 5547, linkedinEngagement: "Active poster: building Vercel Startups GTM + hiring; co-hosts The Room Podcast. 5,547 followers.", source: "clay" },

  // ── Linear ──────────────────────────────────────────────────────────────
  { companyId: "linear", profileId: "771759661", firstName: "Casey", lastName: "Bertenthal", title: "Head of Sales", email: "casey@linear.app", emailVerified: true, linkedinUrl: "https://www.linkedin.com/in/casey-bertenthal/", location: "San Francisco, California, United States", euResident: false, linkedinFollowers: 3343, linkedinEngagement: "3,343 followers; Head of Sales at Linear.", source: "clay" },
  { companyId: "linear", profileId: "608175733", firstName: "Nathalie", lastName: "Marchino", title: "Head of Sales, EMEA", email: "nathalie@linear.app", emailVerified: true, linkedinUrl: "https://www.linkedin.com/in/nathaliemarchino/", location: "United Kingdom", euResident: true, linkedinFollowers: 3795, linkedinEngagement: "3,795 followers; Head of Sales EMEA at Linear.", source: "clay" },
  { companyId: "linear", profileId: "615437767", firstName: "Jack", lastName: "Mangan", title: "Growth Sales Leader", email: "jack@linear.app", emailVerified: true, linkedinUrl: "https://www.linkedin.com/in/jack-mangan-a5a4a9108/", location: "San Francisco, California, United States", euResident: false, linkedinFollowers: 3198, linkedinEngagement: "3,198 followers; Growth Sales Leader at Linear.", source: "clay" },
];

export function poolByCompany() {
  return ENRICHMENT_COMPANIES.map((c) => ({ company: c, contacts: ENRICHMENT_POOL.filter((p) => p.companyId === c.id) }));
}
