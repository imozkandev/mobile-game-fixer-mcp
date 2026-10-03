import { NextRequest, NextResponse } from "next/server";
import { KnowledgeBase } from "../../../../../dist/knowledge.js";
import { getPrelaunchChecklist, getLaunchRunbook } from "../../../../../dist/core/checklist.js";
import { getKnowledgeDir } from "@/lib/engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "checklist";

  KnowledgeBase.getInstance(getKnowledgeDir());

  if (type === "runbook") {
    const phase = (searchParams.get("phase") || undefined) as any;
    const report = getLaunchRunbook({ phase });
    return NextResponse.json(report);
  }

  const platform = (searchParams.get("platform") || "both") as any;
  const monStr = searchParams.get("monetization");
  const monetization = monStr ? (monStr.split(",") as any) : [];
  const kids = searchParams.get("kids") === "true";
  const genre = searchParams.get("genre") || undefined;

  const report = getPrelaunchChecklist({ platform, monetization, kids, genre });
  return NextResponse.json(report);
}
