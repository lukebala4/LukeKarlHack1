import { describe, expect, it } from "vitest";
import { appendEvent, clearEvents, listEvents } from "./event-store";

describe("pipeline event persistence", () => {
  it("persists events and deduplicates by ID", () => {
    clearEvents("job-1");
    const event = {
      id: "event-1", jobId: "job-1", type: "job.started" as const, timestamp: new Date().toISOString(),
      provider: "internal" as const, message: "Demo Run started", demo: true, payload: {},
    };
    appendEvent(event);
    appendEvent(event);
    expect(listEvents("job-1")).toEqual([event]);
    expect(listEvents("job-1")[0].demo).toBe(true);
  });
});
