import { describe, expect, it } from "vitest";
import { fixtureProspects } from "@/src/repositories/fixtures";
import { DatabaseApprovedProspectRepository, MockApprovedProspectRepository } from "@/src/repositories/approved-prospects";
import { calculateReadiness, canEnterOutreach, generateEmailDraft, ProviderSyncService, selectOutreachPlay, validateDraft } from "./engine";

describe("Stage 1 handoff and eligibility", () => {
  it("consumes approved prospects through the mock interface", async () => {
    const repository = new MockApprovedProspectRepository();
    const prospects = await repository.listApprovedProspects();
    expect(prospects).toHaveLength(6);
    expect(prospects[0].evidence[0].id).toBe("ev-maya-1");
  });

  it("uses the database adapter without changing the repository contract", async () => {
    const db = {
      approvedProspect: {
        findMany: async () => [fixtureProspects[0]],
        findUnique: async () => fixtureProspects[0],
        update: async () => ({}),
      },
    };
    const repository = new DatabaseApprovedProspectRepository(db);
    expect((await repository.listApprovedProspects())[0].id).toBe("maya-chen");
    expect((await repository.getApprovedProspect("maya-chen"))?.evidence).toHaveLength(3);
  });

  it.each([
    ["unapproved", { approvalStatus: "pending" as const }, "Prospect has not been approved"],
    ["suppressed", { approvalStatus: "suppressed" as const }, "Prospect has not been approved"],
  ])("prevents %s prospects from entering outreach", (_, patch, blocker) => {
    const prospect = { ...fixtureProspects[0], ...patch };
    expect(canEnterOutreach(prospect)).toEqual(expect.objectContaining({ allowed: false, blockers: expect.arrayContaining([blocker]) }));
  });

  it("prevents opt-outs, duplicates, and direct competitors", () => {
    for (const restriction of ["optOut", "duplicate", "directCompetitor"] as const) {
      const prospect = { ...fixtureProspects[0], restrictions: { ...fixtureProspects[0].restrictions, [restriction]: true } };
      expect(canEnterOutreach(prospect).allowed).toBe(false);
    }
  });

  it("keeps evidence IDs attached across the handoff", () => {
    const draft = generateEmailDraft(fixtureProspects[0]);
    expect(draft.claims[0].evidenceId).toBe(fixtureProspects[0].evidence[0].id);
    expect(validateDraft(draft, fixtureProspects[0]).claimsValid).toBe(true);
  });
});

describe("outreach selection and quality", () => {
  it("requires valid evidence for every personalised claim", () => {
    const draft = generateEmailDraft(fixtureProspects[0]);
    draft.claims[0].evidenceId = "invented";
    expect(validateDraft(draft, fixtureProspects[0]).approvable).toBe(false);
  });

  it("blocks generic reusable personalisation", () => {
    const draft = generateEmailDraft(fixtureProspects[0]);
    draft.body = "Hi Maya, I love what you are building. Want to chat?";
    draft.claims = [];
    expect(validateDraft(draft, fixtureProspects[0]).approvable).toBe(false);
  });

  it("never generates social direct messages", () => {
    const draft = generateEmailDraft(fixtureProspects[0]);
    expect(JSON.stringify(draft).toLowerCase()).not.toContain("linkedin dm");
    expect(JSON.stringify(draft).toLowerCase()).not.toContain("x dm");
  });

  it("ranks a warm introduction above cold email", () => {
    expect(selectOutreachPlay(fixtureProspects.find((p) => p.id === "theo-grant")!).recommended).toBe("Warm Introduction");
  });

  it("does not let Champion Score bypass low Outreach Readiness", () => {
    const lowConfidence = fixtureProspects.find((p) => p.id === "priya-nair")!;
    expect(lowConfidence.championScore).toBeGreaterThan(80);
    expect(calculateReadiness(lowConfidence).score).toBeLessThan(70);
  });

  it("prevents duplicate provider sync", () => {
    const service = new ProviderSyncService();
    expect(service.sync("maya", "draft").status).toBe("synced");
    expect(service.sync("maya", "draft").status).toBe("duplicate_prevented");
  });
});
