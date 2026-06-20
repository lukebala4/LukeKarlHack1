import { z } from "zod";

const requestSchema = z.object({ prospectId: z.string().min(1), draftId: z.string().min(1), provider: z.enum(["unify", "zero"]) });
const synced = new Set<string>();

export async function POST(request: Request) {
  const result = requestSchema.safeParse(await request.json());
  if (!result.success) return Response.json({ error: "Invalid sync request", details: result.error.flatten() }, { status: 400 });
  const key = `${result.data.provider}:${result.data.prospectId}:${result.data.draftId}`;
  if (synced.has(key)) return Response.json({ status: "duplicate_prevented", idempotencyKey: key });
  synced.add(key);
  return Response.json({ status: "synced", idempotencyKey: key, destination: result.data.provider, demo: true });
}
