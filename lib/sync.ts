/**
 * Sync an approved champion into the outreach-ready pipeline.
 *  • Zero  → company + contact + deal (+ note with the personalization brief)
 *  • Unify → company + person records (with champion tier/score custom attributes)
 *
 * SENDING IS NOT PERFORMED HERE. This produces "outreach ready" state only — a deal in
 * the CRM and a synced lead. Live send is a separate, explicit action.
 */
import "server-only";
import type { CostLedgerEntry, UnifiedProspect } from "@/lib/types";
import * as zero from "@/lib/providers/zero";
import * as unify from "@/lib/providers/unify";
import { env } from "@/lib/env";

export type SyncResult = {
  target: "zero" | "unify";
  ok: boolean;
  ids: Record<string, string>;
  ledger: CostLedgerEntry[];
  error?: string;
};

function emailOf(p: UnifiedProspect): string | undefined {
  return p.contactRoutes.find((r) => r.channel === "email")?.value;
}

export async function syncToZero(p: UnifiedProspect): Promise<SyncResult> {
  const ledger: CostLedgerEntry[] = [];
  const ids: Record<string, string> = {};
  try {
    const company = await zero.upsertCompany({
      name: p.company.name,
      domain: p.company.domain,
      description: `${p.company.isAiNative ? "AI-native " : ""}${p.company.fundingStage ?? ""} — sourced by Lightfern Champion Engine`.trim(),
    });
    ledger.push(company.ledger);
    if (!company.ok) return { target: "zero", ok: false, ids, ledger, error: company.error };
    ids.companyId = company.data?.id;

    const contact = await zero.createContact({
      name: p.name,
      companyId: ids.companyId,
      title: p.title,
      email: emailOf(p),
      linkedin: p.linkedin,
      x: p.x,
    });
    ledger.push(contact.ledger);
    if (!contact.ok) return { target: "zero", ok: false, ids, ledger, error: contact.error };
    ids.contactId = contact.data?.id;

    const deal = await zero.createDeal({
      name: `[Tier ${p.score.tier}] ${p.name} — Champion ${p.score.total}`,
      companyId: ids.companyId,
      contactIds: ids.contactId ? [ids.contactId] : undefined,
      confidence: +(p.score.total / 100).toFixed(2),
    });
    ledger.push(deal.ledger);
    if (deal.ok) ids.dealId = deal.data?.id;

    return { target: "zero", ok: true, ids, ledger };
  } catch (e) {
    return { target: "zero", ok: false, ids, ledger, error: String(e) };
  }
}

export async function syncToUnify(p: UnifiedProspect): Promise<SyncResult> {
  const ledger: CostLedgerEntry[] = [];
  const ids: Record<string, string> = {};
  const email = emailOf(p);
  if (!email) return { target: "unify", ok: false, ids, ledger, error: "no email to key the person record" };

  const [first, ...rest] = p.name.split(" ");
  const last = rest.join(" ");
  const res = await unify.upsertPerson({
    email,
    first_name: first,
    last_name: last,
    linkedin_url: p.linkedin,
  });
  ledger.push(res.ledger);
  if (!res.ok) return { target: "unify", ok: false, ids, ledger, error: res.error ?? `HTTP ${res.status}` };
  if (res.data?.id) ids.personId = res.data.id;
  return { target: "unify", ok: true, ids, ledger };
}

export async function syncProspect(p: UnifiedProspect, targets: ("zero" | "unify")[]): Promise<SyncResult[]> {
  const out: SyncResult[] = [];
  if (targets.includes("zero")) out.push(await syncToZero(p));
  if (targets.includes("unify") && env.unifyApiKey) out.push(await syncToUnify(p));
  return out;
}
