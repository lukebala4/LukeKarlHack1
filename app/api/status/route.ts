import { NextResponse } from "next/server";
import * as zero from "@/lib/providers/zero";
import * as unify from "@/lib/providers/unify";
import * as scaile from "@/lib/providers/scaile";

export const dynamic = "force-dynamic";

export async function GET() {
  const [z, u, s] = await Promise.all([zero.status(), unify.status(), scaile.status()]);
  return NextResponse.json({ providers: [z, u, s], checkedAt: new Date().toISOString() });
}
