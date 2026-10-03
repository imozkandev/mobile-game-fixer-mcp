import { NextRequest, NextResponse } from "next/server";
import { KnowledgeBase } from "../../../../../dist/knowledge.js";
import { diagnose } from "../../../../../dist/core/search.js";
import { getKnowledgeDir } from "@/lib/engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symptom = searchParams.get("symptom") || "";
  const platform = (searchParams.get("platform") || undefined) as any;
  const engine = (searchParams.get("engine") || undefined) as any;
  const limitStr = searchParams.get("limit");
  const limit = limitStr ? parseInt(limitStr, 10) : 5;

  KnowledgeBase.getInstance(getKnowledgeDir());
  const report = diagnose({ symptom, platform, engine, limit });

  return NextResponse.json(report);
}
