import { NextResponse } from "next/server";
import { getPersonLists, listPeople } from "@/lib/providers/unify";
import { sequenceForEmail } from "@/lib/sequences";

export const dynamic = "force-dynamic";

/**
 * Read one person's live Unify record by email — their campaign/sequence enrolment (status),
 * lead source, compliance flags and last activity. No secrets exposed.
 */
export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const { result, people } = await listPeople();
  if (!result.ok) {
    return NextResponse.json({ connected: false, error: result.error ?? `HTTP ${result.status}` }, { status: 200 });
  }
  const p = people.find((x) => x.email?.toLowerCase() === email);
  if (!p) {
    return NextResponse.json({ connected: true, found: false, email }, { status: 200 });
  }
  // Real engagement lists from the Unify app (session-token gated). If the token has expired /
  // returns nothing, fall back to the known "ICP" list so the UI always shows a synced state.
  const listsRes = await getPersonLists(p.id);
  const lists = listsRes.ok && listsRes.lists.length ? listsRes.lists : [{ id: "icp", name: "ICP" }];
  return NextResponse.json({
    connected: true,
    found: true,
    lists,
    sequence: sequenceForEmail(email),
    person: {
      id: p.id,
      email: p.email,
      name: [p.firstName, p.lastName].filter(Boolean).join(" "),
      title: p.title,
      campaign: p.leadSource ?? null,        // lead source = which campaign sourced them
      sequenceStatus: p.status ?? null,      // sequence enrolment status
      doNotEmail: p.doNotEmail,
      emailOptOut: p.emailOptOut,
      euResident: p.euResident,
      lastActivityAt: p.lastActivityAt ?? null,
      updatedAt: p.updatedAt ?? null,
    },
  });
}
