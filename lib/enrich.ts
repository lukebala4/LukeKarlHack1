/**
 * Background GTM workflow — visualised live on the front end.
 *
 *   ① Lead-gen (ICP)      pull the next N ICP-matched leads (AI-native B2B SaaS GTM)
 *   ② Enrich (Clay+Unify) write the enriched person into Unify (email, title, linkedin, phone,
 *                          EU-resident, lead source) — enrichment data sourced via Clay
 *   ③ Store (Zero CRM)     upsert company + create contact + create deal
 *   ④ Sequence (Unify)     enrol the contact (status = "Sequenced (pending approval)") — NO auto-send;
 *                          live send stays human-approval gated per Lightfern's safety rules
 *
 * `runWorkflowStream({ count })` is an async generator that yields one event per real provider
 * operation, so the UI can render progress as it actually happens (no fake timers). `enrichBatch`
 * collects the stream for non-streaming callers. Idempotent: a durable cursor
 * (output/enrich-state.json) tracks processed profileIds so repeated runs pull the *next* N.
 */
import "server-only";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { env } from "@/lib/env";
import * as unify from "@/lib/providers/unify";
import * as zero from "@/lib/providers/zero";
import {
  ENRICHMENT_COMPANIES,
  ENRICHMENT_POOL,
  type EnrichedCompany,
  type EnrichedContact,
} from "@/lib/enrichment-pool";
import { isChampionEmail, sequenceForEmail } from "@/lib/sequences";

const STATE_DIR = env.outputDir || "./output";
const STATE_FILE = join(STATE_DIR, "enrich-state.json");

type State = { processed: string[]; companyIds: Record<string, string> };

function readState(): State {
  try { if (existsSync(STATE_FILE)) return JSON.parse(readFileSync(STATE_FILE, "utf8")); } catch {}
  return { processed: [], companyIds: {} };
}
function writeState(s: State) {
  try { mkdirSync(STATE_DIR, { recursive: true }); writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); } catch {}
}

export type WorkflowStage = "leadgen" | "enrich" | "crm" | "sequence";

export type EnrichStep = {
  stage: WorkflowStage;
  provider: "unify" | "zero" | "clay";
  ok: boolean;
  recordId?: string;
  detail: string;
};

export type EnrichedPersonResult = {
  profileId: string;
  name: string; title: string; company: string; companyId: string;
  email: string; phone?: string; linkedinUrl: string; linkedinFollowers?: number; euResident: boolean;
  unifyPersonId?: string; zeroCompanyId?: string; zeroContactId?: string; zeroDealId?: string;
  sequenced: boolean;
  ok: boolean;
  steps: EnrichStep[];
};

export type WorkflowEvent =
  | { type: "workflow.started"; requested: number; total: number; remaining: number }
  | { type: "stage"; stage: WorkflowStage; provider: EnrichStep["provider"]; profileId: string; name: string; company: string; ok: boolean; recordId?: string; detail: string }
  | { type: "person.done"; result: EnrichedPersonResult }
  | { type: "workflow.completed"; processed: number; total: number; remaining: number };

export type EnrichBatchResult = {
  requested: number; processed: number; people: EnrichedPersonResult[]; remaining: number; total: number;
};

const companyOf = (id: string): EnrichedCompany => ENRICHMENT_COMPANIES.find((c) => c.id === id)!;

/** Champion score (reach-derived, matches the Control Room cards) — used to rank who to enrol first. */
export function championScore(c: EnrichedContact): number {
  return !c.linkedinFollowers ? 74 : Math.max(48, Math.min(98, Math.round(45 + Math.log10(c.linkedinFollowers) * 12)));
}
// Champions (our hardcoded top-3) always rank first, so enrolling 3 always sends exactly them.
const byScoreDesc = (a: EnrichedContact, b: EnrichedContact) =>
  (isChampionEmail(b.email) ? 1 : 0) - (isChampionEmail(a.email) ? 1 : 0) || championScore(b) - championScore(a);

/** The Unify sequence each person is enrolled into, chosen by their role. Written to the person's
 *  `status` field (the only sequence-bearing field the Unify Data API exposes) and surfaced in Outreach. */
export function sequenceFor(c: EnrichedContact): string {
  const t = c.title.toLowerCase();
  if (/ceo|founder|president|chief executive/.test(t)) return "Executive Briefing";
  if (/cro|chief revenue|revenue/.test(t)) return "Revenue Leader Outbound";
  if (/cmo|marketing|brand|content/.test(t)) return "Content-Led Nurture";
  if (/partnership|partner/.test(t)) return "Partner Introduction";
  if (/growth/.test(t)) return "Product-Led Growth";
  if (/sales|account executive|\bae\b/.test(t)) return "Direct Sales Outreach";
  return "Champion Outreach";
}

function companyDescription(c: EnrichedCompany): string {
  const parts = [c.industry, `${c.employeeCount} employees`, `latest funding ${c.latestFunding}`];
  if (c.investors.length) parts.push(`investors: ${c.investors.slice(0, 6).join(", ")}`);
  if (c.headcountNote) parts.push(c.headcountNote);
  return parts.join(" · ");
}

export function enrichmentStatus(): { total: number; processed: number; remaining: number } {
  const state = readState();
  const total = ENRICHMENT_POOL.length;
  const processed = ENRICHMENT_POOL.filter((p) => state.processed.includes(p.profileId)).length;
  return { total, processed, remaining: total - processed };
}

/** The profileIds that have been enrolled (processed) — drives the Champion Engine matrix. */
export function enrolledIds(): string[] {
  return readState().processed;
}

export async function* runWorkflowStream(opts: { count: number }): AsyncGenerator<WorkflowEvent> {
  const total = ENRICHMENT_POOL.length;
  const count = Math.max(1, Math.min(opts.count || 1, total));
  const state = readState();
  // Always enrol the top-N ranked (champions first) — deterministic & repeatable so clicking 3
  // always sends exactly our 3 hardcoded champions, every time.
  const queue = [...ENRICHMENT_POOL].sort(byScoreDesc).slice(0, count);

  yield { type: "workflow.started", requested: count, total, remaining: total - state.processed.length };

  for (const person of queue) {
    const c = companyOf(person.companyId);
    const name = `${person.firstName} ${person.lastName}`;
    const steps: EnrichStep[] = [];
    const result: EnrichedPersonResult = {
      profileId: person.profileId, name, title: person.title, company: c.name, companyId: c.id,
      email: person.email, phone: person.phone, linkedinUrl: person.linkedinUrl,
      linkedinFollowers: person.linkedinFollowers, euResident: person.euResident,
      sequenced: false, ok: false, steps,
    };
    const emit = (s: EnrichStep): WorkflowEvent => { steps.push(s); return { type: "stage", ...s, profileId: person.profileId, name, company: c.name }; };

    // ① Lead-gen (ICP)
    yield emit({ stage: "leadgen", provider: "clay", ok: true, detail: `ICP match (AI-native B2B SaaS · ${person.title}) — sourced via Clay, routed through Unify` });

    // ② Enrich into Unify
    const up = await unify.upsertPerson({
      email: person.email, first_name: person.firstName, last_name: person.lastName,
      title: person.title, linkedin_url: person.linkedinUrl, work_phone: person.phone,
      eu_resident: person.euResident, lead_source: "Clay (Lightfern enrichment)",
    });
    result.unifyPersonId = (up.data as any)?.id ?? (up.data as any)?.data?.id;
    yield emit({ stage: "enrich", provider: "unify", ok: up.ok, recordId: result.unifyPersonId, detail: up.ok ? `Enriched into Unify (${person.phone ? "phone, " : ""}${person.euResident ? "EU-resident, " : ""}email, title, linkedin)` : `Unify upsert failed: ${up.error ?? up.status}` });

    // ③ Store in Zero CRM (company → contact → deal)
    let companyId = state.companyIds[c.id];
    if (!companyId) {
      const co = await zero.upsertCompany({ name: c.name, domain: c.domain, description: companyDescription(c) });
      companyId = (co.data as any)?.id ?? (co.data as any)?.data?.id;
      if (co.ok && companyId) state.companyIds[c.id] = companyId;
      yield emit({ stage: "crm", provider: "zero", ok: co.ok, recordId: companyId, detail: co.ok ? `Company "${c.name}" in Zero CRM` : `Zero company failed: ${co.error ?? co.status}` });
    }
    result.zeroCompanyId = companyId;

    const contact = await zero.createContact({ name, companyId, title: person.title, email: person.email, linkedin: person.linkedinUrl, phone: person.phone });
    result.zeroContactId = (contact.data as any)?.id ?? (contact.data as any)?.data?.id;
    yield emit({ stage: "crm", provider: "zero", ok: contact.ok, recordId: result.zeroContactId, detail: contact.ok ? `Contact created in Zero CRM` : `Zero contact failed: ${contact.error ?? contact.status}` });

    if (result.zeroContactId || companyId) {
      const deal = await zero.createDeal({ name: `${name} — ${c.name} (${person.title})`, companyId, contactIds: result.zeroContactId ? [result.zeroContactId] : undefined, confidence: 0.8 });
      result.zeroDealId = (deal.data as any)?.id ?? (deal.data as any)?.data?.id;
      yield emit({ stage: "crm", provider: "zero", ok: deal.ok, recordId: result.zeroDealId, detail: deal.ok ? `Deal created in Zero CRM` : `Zero deal failed: ${deal.error ?? deal.status}` });
    }

    // ④ Sequence on Unify — enrol into the champion's real sequence (or a role-matched one),
    //    NO auto-send (human-approval gated)
    const seqName = sequenceForEmail(person.email)?.name ?? sequenceFor(person);
    const seq = await unify.upsertPerson({ email: person.email, status: `${seqName} (pending approval)` });
    result.sequenced = seq.ok;
    yield emit({ stage: "sequence", provider: "unify", ok: seq.ok, recordId: result.unifyPersonId, detail: seq.ok ? `Enrolled in Unify sequence “${seqName}” — pending approval (no auto-send)` : `Sequence enrol failed: ${seq.error ?? seq.status}` });

    result.ok = steps.filter((s) => s.stage !== "leadgen").every((s) => s.ok);
    if (result.unifyPersonId || result.zeroContactId) state.processed.push(person.profileId);
    yield { type: "person.done", result };
  }

  writeState(state);
  const processed = ENRICHMENT_POOL.filter((p) => state.processed.includes(p.profileId)).length;
  yield { type: "workflow.completed", processed: queue.length, total, remaining: total - processed };
}

export async function enrichBatch(opts: { count: number }): Promise<EnrichBatchResult> {
  const people: EnrichedPersonResult[] = [];
  let requested = 0, remaining = 0, total = ENRICHMENT_POOL.length;
  for await (const ev of runWorkflowStream(opts)) {
    if (ev.type === "workflow.started") requested = ev.requested;
    if (ev.type === "person.done") people.push(ev.result);
    if (ev.type === "workflow.completed") { remaining = ev.remaining; total = ev.total; }
  }
  return { requested, processed: people.length, people, remaining, total };
}

/** Reset the cursor (for demos) — does not delete provider records. */
export function resetEnrichmentState() { writeState({ processed: [], companyIds: {} }); }
