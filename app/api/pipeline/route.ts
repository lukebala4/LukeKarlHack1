import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = runPipeline();
  return NextResponse.json(result);
}
