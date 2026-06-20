// BFF proxy → Stage 1 backend champion-scoring pipeline (the Reach × Mission matrix).
const BACKEND = process.env.BACKEND_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await fetch(`${BACKEND}/api/pipeline`, { cache: "no-store" });
    return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return Response.json({ error: "backend_unreachable", detail: String(e) }, { status: 502 });
  }
}
