import { NextRequest, NextResponse } from "next/server";
import { KnowledgeBase } from "../../../../../dist/knowledge.js";
import { getKnowledgeDir } from "@/lib/engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const category = searchParams.get("category");
  const platform = searchParams.get("platform");

  const kb = KnowledgeBase.getInstance(getKnowledgeDir());

  if (id) {
    const cleanId = id.trim().toUpperCase();
    const problem = kb.getProblem(cleanId);
    if (!problem) {
      return NextResponse.json({ error: `'${id}' ID'li problem bulunamadı.` }, { status: 404 });
    }
    return NextResponse.json({ problem });
  }

  let problems = kb.getAllProblems();

  if (category && category !== "all") {
    problems = problems.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (platform && platform !== "all") {
    problems = problems.filter((p) => p.platforms.includes(platform as any) || p.platforms.includes("any"));
  }

  return NextResponse.json({
    total: problems.length,
    problems: problems.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      severity: p.severity,
      confidence: p.confidence,
      platforms: p.platforms,
      engines: p.engines,
      symptoms: p.symptoms,
      firstStep: p.solution[0]?.action
    }))
  });
}
