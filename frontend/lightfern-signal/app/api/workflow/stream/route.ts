// BFF SSE proxy → Stage 1 backend workflow stream (same-origin for the browser).
const BACKEND = process.env.BACKEND_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const count = new URL(req.url).searchParams.get("count") || "1";
  try {
    const upstream = await fetch(`${BACKEND}/api/workflow/stream?count=${encodeURIComponent(count)}`, {
      headers: { Accept: "text/event-stream" },
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) {
      return new Response(`event: workflow.error\ndata: ${JSON.stringify({ message: `backend ${upstream.status}` })}\n\n`, { status: 502, headers: { "Content-Type": "text/event-stream" } });
    }
    return new Response(upstream.body, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
    });
  } catch (e) {
    return new Response(`event: workflow.error\ndata: ${JSON.stringify({ message: String(e) })}\n\n`, { status: 502, headers: { "Content-Type": "text/event-stream" } });
  }
}
