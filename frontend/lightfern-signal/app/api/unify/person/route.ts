// BFF proxy → Stage 1 backend: one person's live Unify record (campaign / sequence status).
const BACKEND = process.env.BACKEND_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email") ?? "";
  try {
    const r = await fetch(`${BACKEND}/api/unify/person?email=${encodeURIComponent(email)}`, { cache: "no-store" });
    return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return Response.json({ connected: false, error: String(e) }, { status: 200 });
  }
}
