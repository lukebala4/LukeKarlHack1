import { runPipeline } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const { prospects } = runPipeline();
  const headers = ["name", "title", "company", "domain", "tier", "total", "reach", "mission", "emailVolume", "primaryChannel", "email", "linkedin", "x", "trigger", "draftOpener"];
  const rows = prospects.map((p) =>
    [
      p.name, p.title, p.company.name, p.company.domain ?? "", p.score.tier, p.score.total,
      p.score.reachScore, p.score.missionScore, p.score.emailVolumeScore, p.channel.primary,
      p.contactRoutes.find((r) => r.channel === "email")?.value ?? "", p.linkedin ?? "", p.x ?? "",
      p.personalization?.triggerEvent ?? "", p.personalization?.draftOpener ?? "",
    ].map(csvCell).join(","),
  );
  const csv = [headers.map(csvCell).join(","), ...rows].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="lightfern-champions.csv"` },
  });
}
