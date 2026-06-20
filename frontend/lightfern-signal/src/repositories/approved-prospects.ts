import { ApprovedProspect, ApprovedProspectRepository } from "@/src/contracts/outreach";
import { fixtureProspects } from "./fixtures";

export class MockApprovedProspectRepository implements ApprovedProspectRepository {
  private prepared = new Map<string, string>();
  async listApprovedProspects() { return structuredClone(fixtureProspects); }
  async getApprovedProspect(id: string) { return structuredClone(fixtureProspects.find((p) => p.id === id) ?? null); }
  async markOutreachPrepared(prospectId: string, outreachId: string) { this.prepared.set(prospectId, outreachId); }
}

export interface Stage1DatabaseClient {
  approvedProspect: {
    findMany(args: Record<string, unknown>): Promise<ApprovedProspect[]>;
    findUnique(args: Record<string, unknown>): Promise<ApprovedProspect | null>;
    update(args: Record<string, unknown>): Promise<unknown>;
  };
}

export class DatabaseApprovedProspectRepository implements ApprovedProspectRepository {
  constructor(private readonly db: Stage1DatabaseClient) {}
  listApprovedProspects() {
    return this.db.approvedProspect.findMany({ where: { approvalStatus: "approved" }, include: { evidence: true, triggers: true } });
  }
  getApprovedProspect(prospectId: string) {
    return this.db.approvedProspect.findUnique({ where: { id: prospectId }, include: { evidence: true, triggers: true } });
  }
  async markOutreachPrepared(prospectId: string, outreachId: string) {
    await this.db.approvedProspect.update({ where: { id: prospectId }, data: { outreachId, outreachPreparedAt: new Date() } });
  }
}

export const approvedProspects: ApprovedProspectRepository = new MockApprovedProspectRepository();
