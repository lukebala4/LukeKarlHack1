import { NextResponse } from "next/server";
import { providerConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Liveness + capability summary for the Stage 1 backend (no secrets exposed). */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "lightfern-champion-engine",
    version: "0.1.0",
    time: new Date().toISOString(),
    providersConfigured: {
      unify: providerConfigured.unify(),
      zero: providerConfigured.zero(),
      scaile: providerConfigured.scaile(),
      anthropic: providerConfigured.anthropic(),
    },
  });
}
