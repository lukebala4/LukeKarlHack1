// BFF proxy → Stage 1 backend. Keeps the backend URL + provider keys server-side.
const BACKEND = process.env.BACKEND_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await fetch(`${BACKEND}/api/workflow`, { cache: "no-store" });
    return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return Response.json({ error: "backend_unreachable", detail: String(e) }, { status: 502 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const r = await fetch(`${BACKEND}/api/workflow`, { method: "POST", headers: { "Content-Type": "application/json" }, body, cache: "no-store" });
    return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return Response.json({ error: "backend_unreachable", detail: String(e) }, { status: 502 });
  }
}
