import { NextResponse } from "next/server";
import { z } from "zod";
import { championScore, enrichBatch, enrichmentStatus, enrolledIds, resetEnrichmentState } from "@/lib/enrich";
import { poolByCompany } from "@/lib/enrichment-pool";
import { isChampionEmail } from "@/lib/sequences";

export const dynamic = "force-dynamic";

/** Workflow status + the ICP pool (grouped by company), for the front-end visualiser. */
export async function GET() {
  return NextResponse.json({
    status: enrichmentStatus(),
    enrolledIds: enrolledIds(),
    pool: poolByCompany().map(({ company, contacts }) => ({
      company: { id: company.id, name: company.name, domain: company.domain, latestFunding: company.latestFunding, employeeCount: company.employeeCount },
      contacts: contacts.map((c) => ({ profileId: c.profileId, name: `${c.firstName} ${c.lastName}`, title: c.title, email: c.email, phone: c.phone, linkedinFollowers: c.linkedinFollowers, euResident: c.euResident, linkedinEngagement: c.linkedinEngagement, championScore: championScore(c), isChampion: isChampionEmail(c.email) }))
        .sort((a, b) => (b.isChampion ? 1 : 0) - (a.isChampion ? 1 : 0) || b.championScore - a.championScore),
    })),
  });
}

const Body = z.object({ count: z.number().int().min(1).max(15).optional(), reset: z.boolean().optional() });

/** Run the workflow for N people (non-streaming). Prefer GET /api/workflow/stream for live UI. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });
  if (parsed.data.reset) resetEnrichmentState();
  const result = await enrichBatch({ count: parsed.data.count ?? 1 });
  return NextResponse.json(result);
}
