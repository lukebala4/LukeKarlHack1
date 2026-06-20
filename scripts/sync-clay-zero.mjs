// Create a REAL enriched profile in Zero from live Clay data — mapped to dedicated columns.
// Run: set -a; source .env; set +a; node scripts/sync-clay-zero.mjs
const ZERO = process.env.ZERO_API_KEY;
const WS = process.env.ZERO_WORKSPACE_ID;
const base = "https://api.zero.inc";
const H = { Authorization: `Bearer ${ZERO}`, "x-workspace-id": WS, "Content-Type": "application/json" };

// Dedicated contact columns (created via POST /api/columns, entity=contacts)
const COL = {
  championScore: "14cf6ee8-4550-4115-ac84-97ec91d7c189",
  championTier: "b8d2700e-99e9-4bf9-a475-2c7ce8fe27e6",
  reach: "dc8a7f21-9446-4ac6-9223-28bc4f6ab8b5",
  mission: "53fcdf08-75e5-4cd4-a9a2-01904d9aeea9",
  workHistory: "8e80cb46-d4b9-4339-8777-d3ea50307787",
  thoughtLeadership: "914df7ec-39d2-45cb-801f-cd4f379a4f61",
  linkedinEngagement: "90d89e50-adeb-4215-8575-60220a8abc26",
  followerCount: "99d08177-dde8-419d-b8d5-413ac04f3f79",
  source: "618258a1-c86e-4999-91e1-8a99449e3549",
  notes: "3d992b40-220f-4f54-8b71-121e3bc3032e",
};

async function post(path, body) {
  const r = await fetch(base + path, { method: "POST", headers: H, body: JSON.stringify({ workspaceId: WS, ...body }) });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, data: j.data, error: j.error };
}

// Real, Clay-enriched champions (writer.com). Phone: none found by Clay. Follower count: not enriched.
const champions = [
  {
    name: "Diego Lomanto", title: "Chief Marketing Officer", email: "diego.lomanto@writer.com",
    linkedin: "https://www.linkedin.com/in/diego-lomanto-756301/", phone: "",
    workHistory: "CMO at Writer; ex-UiPath, Talent Inc., WorkMarket. GTM strategy, product marketing, demand gen, brand positioning; scaled marketing orgs across enterprise B2B/SaaS.",
    linkedinEngagement: "(LinkedIn activity feed not public) Known themes: AI marketing, 'become more human in the age of AI', enterprise storytelling.",
    thoughtLeadership: "• 'How marketers should become more human in the age of AI' — youtube.com/watch?v=LiebjQH5yjs\n• Diego Lomanto on AI marketing & the agentic future — writer.com/blog/humans-of-ai-diego-lomanto\n• Beat the Hype — How to Market AI (podcast)",
  },
  {
    name: "May Habib", title: "Co-founder & CEO", email: "may@writer.com",
    linkedin: "https://www.linkedin.com/in/may-habib/", phone: "",
    workHistory: "Co-founder & CEO of Writer; leads product, engineering and GTM. Building a full-stack enterprise generative-AI platform.",
    linkedinEngagement: "Generative/enterprise AI, AI for writing & content, software writing quality, human-centric AI (augment not replace), AI ethics; speaking at London Tech Week & AI Leaders Forum.",
    thoughtLeadership: "• First Round Review podcast: scaling & selling AI products for enterprise\n• Humans of AI: May Habib — writer.com/blog/humans-of-ai-may-habib\n• YouTube talk on enterprise AI & Writer strategy",
  },
  {
    name: "Alex Wettreich", title: "Head of Sales", email: "alex.wettreich@writer.com",
    linkedin: "https://www.linkedin.com/in/alex-wettreich-08493/", phone: "",
    workHistory: "VP/Head of Sales at Writer; ex-Airtable, Dropbox, Tenfold, GoodData. SaaS sales leadership scaling enterprise & midmarket teams.",
    linkedinEngagement: "Generative/enterprise AI, sales leadership, GTM strategy, hiring, speaking, product launches, partnerships.",
    thoughtLeadership: "• GTM Substack feature — product/customer/story-led growth\n• GTM2023 speaker (Pavilion)",
  },
];

// Pull real champion scores from the running engine (match by name)
const scores = {};
try {
  const p = await (await fetch("http://localhost:3000/api/pipeline")).json();
  for (const pr of p.prospects) scores[pr.name] = pr.score;
} catch (e) { console.log("(no pipeline scores:", String(e), ")"); }

// 1) Company
const co = await post("/api/companies", {
  name: "Writer", domain: "writer.com", linkedin: "https://www.linkedin.com/company/getwriter",
  description: "AI writing platform — 582 employees, $250M+ raised ($500M–1B revenue). Investors: ICONIQ, Insight, Salesforce Ventures, Adobe Ventures, IBM Ventures. Sourced + enriched via Clay → Lightfern Champion Engine.",
});
if (!co.data?.id) { console.error("company create failed:", co); process.exit(1); }
const companyId = co.data.id;
console.log(`✓ company Writer  id=${companyId}`);

// 2) Contacts — standard fields + every enrichment field in its own column
for (const c of champions) {
  const s = scores[c.name];
  const custom = {
    [COL.workHistory]: c.workHistory,
    [COL.linkedinEngagement]: c.linkedinEngagement,
    [COL.thoughtLeadership]: c.thoughtLeadership,
    [COL.source]: "Clay (writer.com search → Email + Work History + Thought Leadership)",
    [COL.notes]: `Phone: not found (Clay). Follower count: not enriched.`,
  };
  if (s) {
    custom[COL.championScore] = s.total;
    custom[COL.championTier] = s.tier;
    custom[COL.reach] = s.reachScore;
    custom[COL.mission] = s.missionScore;
  }
  const ct = await post("/api/contacts", {
    name: c.name, companyId, title: c.title, email: c.email, linkedin: c.linkedin,
    phone: c.phone || undefined, custom,
  });
  c.id = ct.data?.id; c.score = s;
  console.log(`✓ contact ${c.name.padEnd(16)} [${ct.status}] id=${c.id} ${s ? `(Tier ${s.tier} ${s.total})` : ""}${ct.error ? " ERR:" + ct.error : ""}`);
}

// 3) Deal for the top-scoring champion
const ranked = champions.filter((c) => c.id).sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0));
const top = ranked[0];
if (top) {
  const deal = await post("/api/deals", {
    name: `[Tier ${top.score?.tier ?? "B"}] ${top.name} — Champion ${top.score?.total ?? ""}`,
    companyId, contactIds: [top.id], confidence: top.score ? +(top.score.total / 100).toFixed(2) : 0.6,
  });
  console.log(`✓ deal for ${top.name}: [${deal.status}] id=${deal.data?.id}`);
}
console.log("\nDONE — Writer + 3 contacts with every field in its own Zero column + deal.");
