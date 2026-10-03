import { KnowledgeBase, Problem } from "../knowledge.js";
import { Finding, makeReport, Report } from "./types.js";

export interface DiagnoseOptions {
  symptom: string;
  platform?: "android" | "ios";
  engine?: "unity" | "godot" | "unreal";
  limit?: number;
}

export interface MatchItem {
  id: string;
  title: string;
  score: number;
  confidence: "high" | "medium" | "low";
  matchedTerms: string[];
  firstStep: string;
  category: string;
  severity: string;
  platforms: string[];
  engines: string[];
}

export interface DiagnoseData {
  matches: MatchItem[];
  reason?: string;
  query: string;
  normalizedQuery: string;
}

const STOP_WORDS = new Set([
  "ve", "ile", "bir", "icin", "bu", "da", "de", "mi", "mu", "ne", "var", "yok",
  "ama", "fakat", "the", "a", "an", "and", "or", "in", "on", "at", "to", "for",
  "with", "is", "are", "of", "it", "after", "sonra", "arada", "sure", "kisa",
  "cok", "en", "daha", "gibi", "kadar", "olan", "olarak", "when", "game"
]);

export function normalize(text: string): string {
  if (!text) return "";
  let lowered = text.toLocaleLowerCase("tr-TR");
  // Accent folding
  lowered = lowered
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u");

  // Replace punctuation and symbols with whitespace
  lowered = lowered.replace(/[^\w\s-]/g, " ");
  // Consolidate whitespace
  return lowered.replace(/\s+/g, " ").trim();
}

export function tokenize(text: string): string[] {
  const norm = normalize(text);
  if (!norm) return [];
  const rawTokens = norm.split(/[\s-]+/);
  return rawTokens.filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

export function expandTokens(tokens: string[], synonymsMap: Record<string, string[]>): string[] {
  const expanded = new Set<string>(tokens);

  for (const token of tokens) {
    for (const group of Object.values(synonymsMap)) {
      const normGroup = group.map((item) => normalize(item));
      if (normGroup.some((item) => item === token || item.split(" ").includes(token))) {
        for (const item of normGroup) {
          const subTokens = tokenize(item);
          for (const st of subTokens) {
            expanded.add(st);
          }
        }
      }
    }
  }

  return Array.from(expanded);
}

export function diagnose(options: DiagnoseOptions): Report<DiagnoseData> {
  const { symptom, platform, engine, limit = 3 } = options;
  const kb = KnowledgeBase.getInstance();
  const problems = kb.getAllProblems();
  const synonymsMap = kb.getSynonyms();

  const normQuery = normalize(symptom);
  const baseTokens = tokenize(symptom);
  const baseTokensSet = new Set(baseTokens);

  if (baseTokens.length === 0) {
    return makeReport("diagnose_problem", [], "No significant search keywords found in query.", {
      matches: [],
      reason: "no-confident-match",
      query: symptom,
      normalizedQuery: normQuery
    });
  }

  const queryTokens = expandTokens(baseTokens, synonymsMap);
  const scoredItems: { problem: Problem; score: number; matchedTerms: string[]; directHits: number }[] = [];

  for (const prob of problems) {
    let score = 0;
    let directHits = 0;
    const matchedTermsSet = new Set<string>();

    const normTitle = normalize(prob.title);
    const normKeywords = prob.keywords.map((k) => normalize(k));
    const normSymptoms = prob.symptoms.map((s) => normalize(s));
    const normCauses = prob.causes.map((c) => normalize(c));

    // Exact phrase match bonus
    if (normQuery.length >= 4 && (normTitle.includes(normQuery) || normKeywords.some((k) => k.includes(normQuery)) || normSymptoms.some((s) => s.includes(normQuery)))) {
      score += 6;
      matchedTermsSet.add(`"${normQuery}" (exact match)`);
    }

    // Token scoring
    for (const token of queryTokens) {
      let tokenHit = false;
      const isDirect = baseTokensSet.has(token);
      const weightMultiplier = isDirect ? 1.5 : 0.8;

      // Title match (weight: 3)
      if (normTitle.includes(token)) {
        score += Math.round(3 * weightMultiplier);
        tokenHit = true;
      }

      // Keywords match (weight: 3)
      if (normKeywords.some((k) => k.includes(token))) {
        score += Math.round(3 * weightMultiplier);
        tokenHit = true;
      }

      // Symptoms match (weight: 2)
      if (normSymptoms.some((s) => s.includes(token))) {
        score += Math.round(2 * weightMultiplier);
        tokenHit = true;
      }

      // Causes match (weight: 1)
      if (normCauses.some((c) => c.includes(token))) {
        score += Math.round(1 * weightMultiplier);
        tokenHit = true;
      }

      if (tokenHit) {
        matchedTermsSet.add(token);
        if (isDirect) directHits++;
      }
    }

    // Platform bonus / penalty
    if (platform) {
      if (prob.platforms.includes(platform) || prob.platforms.includes("any")) {
        score += 2;
      } else {
        score -= 5; // Contradicting platform penalty
      }
    }

    // Engine bonus / penalty
    if (engine) {
      if (prob.engines.includes(engine) || prob.engines.includes("any")) {
        score += 2;
      } else {
        score -= 5; // Contradicting engine penalty
      }
    }

    if (score > 0 && matchedTermsSet.size > 0) {
      scoredItems.push({
        problem: prob,
        score,
        matchedTerms: Array.from(matchedTermsSet),
        directHits
      });
    }
  }

  // Sort by directHits then score descending
  scoredItems.sort((a, b) => {
    if (b.directHits !== a.directHits) {
      return b.directHits - a.directHits;
    }
    return b.score - a.score;
  });

  // Confidence threshold
  const SCORE_THRESHOLD = 3;
  const filtered = scoredItems.filter((item) => item.score >= SCORE_THRESHOLD);

  if (filtered.length === 0) {
    return makeReport("diagnose_problem", [], "No confident problem match found in knowledge base.", {
      matches: [],
      reason: "no-confident-match",
      query: symptom,
      normalizedQuery: normQuery
    });
  }

  const topMatches = filtered.slice(0, limit);
  const bestScore = topMatches[0].score;
  const secondScore = topMatches.length > 1 ? topMatches[1].score : 0;

  const matches: MatchItem[] = topMatches.map((m, idx) => {
    let confidence: "high" | "medium" | "low" = "medium";
    if (idx === 0) {
      if (bestScore >= 8 && (bestScore - secondScore >= 3 || topMatches.length === 1)) {
        confidence = "high";
      } else if (bestScore - secondScore < 2 && topMatches.length > 1) {
        confidence = "low";
      }
    } else {
      confidence = secondScore >= 6 ? "medium" : "low";
    }

    return {
      id: m.problem.id,
      title: m.problem.title,
      score: m.score,
      confidence,
      matchedTerms: m.matchedTerms,
      firstStep: m.problem.solution[0]?.action || "No immediate action specified.",
      category: m.problem.category,
      severity: m.problem.severity,
      platforms: m.problem.platforms,
      engines: m.problem.engines
    };
  });

  const findings: Finding[] = matches.map((m) => ({
    severity: m.severity === "critical" ? "error" : m.severity === "high" ? "warning" : "info",
    rule: `problem-${m.id.toLowerCase()}`,
    message: `[${m.id}] ${m.title} (${m.confidence} confidence, score: ${m.score}). Matched terms: ${m.matchedTerms.slice(0, 5).join(", ")}.`,
    fix: m.firstStep,
    problemId: m.id
  }));

  const summary = `${matches.length} probable issue(s) diagnosed. Top match: ${matches[0].id} - ${matches[0].title} (${matches[0].confidence} confidence).`;

  return makeReport("diagnose_problem", findings, summary, {
    matches,
    query: symptom,
    normalizedQuery: normQuery
  });
}
