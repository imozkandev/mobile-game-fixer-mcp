import { NextRequest, NextResponse } from "next/server";
import { KnowledgeBase } from "../../../../../dist/knowledge.js";
import { upcomingDeadlines } from "../../../../../dist/core/deadlines.js";
import { getKnowledgeDir } from "@/lib/engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const daysStr = searchParams.get("days");
  const days = daysStr ? parseInt(daysStr, 10) : 180;
  const platform = (searchParams.get("platform") || "both") as any;

  KnowledgeBase.getInstance(getKnowledgeDir());
  const report = upcomingDeadlines({ days, platform });

  return NextResponse.json(report);
}
