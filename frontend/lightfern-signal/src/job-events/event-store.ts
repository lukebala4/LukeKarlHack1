import { ProspectPipelineEvent } from "@/src/contracts/outreach";

const eventsByJob = new Map<string, ProspectPipelineEvent[]>();

export function appendEvent(event: ProspectPipelineEvent) {
  const events = eventsByJob.get(event.jobId) ?? [];
  if (!events.some((item) => item.id === event.id)) events.push(event);
  eventsByJob.set(event.jobId, events);
  return event;
}

export function listEvents(jobId: string) {
  return [...(eventsByJob.get(jobId) ?? [])];
}

export function clearEvents(jobId: string) {
  eventsByJob.delete(jobId);
}
