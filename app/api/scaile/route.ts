import { NextResponse } from "next/server";
import { z } from "zod";
import { AI_SEARCH_QUERY_MAP, CONTENT_BRIEFS, generateArticle, getArticle } from "@/lib/providers/scaile";

export const dynamic = "force-dynamic";

// GET -> the inbound strategy artifacts (always available, even without live API)
export async function GET() {
  return NextResponse.json({ queryMap: AI_SEARCH_QUERY_MAP, contentBriefs: CONTENT_BRIEFS });
}

const Body = z
  .object({ topic: z.string().min(3).optional(), articleId: z.string().optional() })
  .refine((b) => b.articleId || b.topic, { message: "provide topic (to generate) or articleId (to poll)" });

// POST { topic } -> generate; POST { articleId } -> poll status
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const r = parsed.data.articleId ? await getArticle(parsed.data.articleId) : await generateArticle(parsed.data.topic!);
  return NextResponse.json({ ok: r.ok, status: r.status, data: r.data, error: r.error }, { status: r.ok ? 200 : 502 });
}
