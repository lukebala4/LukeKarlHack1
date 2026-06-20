import { approvedProspects } from "@/src/repositories/approved-prospects";

export async function GET() {
  return Response.json({ data: await approvedProspects.listApprovedProspects(), repository: "mock", demo: true });
}
