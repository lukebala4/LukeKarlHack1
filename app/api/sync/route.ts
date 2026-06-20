import { NextResponse } from "next/server";
import { z } from "zod";
import { runPipeline } from "@/lib/pipeline";
import { syncProspect } from "@/lib/sync";

export const dynamic = "force-dynamic";

const Body = z.object({
  prospectId: z.string(),
  targets: z.array(z.enum(["zero", "unify"])).min(1),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body", issues: parsed.error.issues }, { status: 400 });

  // Re-derive the prospect server-side (deterministic pipeline) so we never trust client data.
  const { prospects } = runPipeline();
  const prospect = prospects.find((p) => p.id === parsed.data.prospectId);
  if (!prospect) return NextResponse.json({ error: "prospect not found" }, { status: 404 });

  const results = await syncProspect(prospect, parsed.data.targets);
  const ok = results.every((r) => r.ok);
  return NextResponse.json({ ok, prospectId: prospect.id, results }, { status: ok ? 200 : 207 });
}
