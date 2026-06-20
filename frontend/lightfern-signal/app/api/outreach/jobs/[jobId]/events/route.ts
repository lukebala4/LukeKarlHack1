import { listEvents } from "@/src/job-events/event-store";

export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const event of listEvents(jobId)) controller.enqueue(encoder.encode(`id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
      controller.enqueue(encoder.encode(`event: stream.ready\ndata: ${JSON.stringify({ jobId })}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
