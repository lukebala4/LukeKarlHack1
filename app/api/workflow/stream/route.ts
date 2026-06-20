import { runWorkflowStream } from "@/lib/enrich";

export const dynamic = "force-dynamic";

/** Live SSE stream of the GTM workflow: one event per real provider operation. */
export async function GET(req: Request) {
  const count = Number(new URL(req.url).searchParams.get("count") || 1);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (ev: unknown, type: string) =>
        controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(ev)}\n\n`));
      try {
        for await (const ev of runWorkflowStream({ count })) send(ev, ev.type);
      } catch (e) {
        send({ message: String(e) }, "workflow.error");
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
