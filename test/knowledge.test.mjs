import test from "node:test";
import assert from "node:assert/strict";
import { KnowledgeBase, ProblemSchema } from "../dist/knowledge.js";

test("KnowledgeBase loads 44 problems successfully", () => {
  const kb = KnowledgeBase.getInstance();
  const problems = kb.getAllProblems();
  assert.equal(problems.length, 44, "Expected 44 problem items");

  const rules = kb.getAllRules();
  assert.ok(rules.length >= 6, "Expected at least 6 store rules");

  const checklists = kb.getAllChecklists();
  assert.ok(checklists.length >= 10, "Expected at least 10 checklist items");

  const runbook = kb.getRunbook();
  assert.ok(runbook !== null && runbook.phases["t-1"] !== undefined);

  const synonyms = kb.getSynonyms();
  assert.ok(Object.keys(synonyms).length >= 15);
});

test("ProblemSchema rejects confidence 'policy' when sources is empty", () => {
  const invalidPolicy = {
    id: "M-99",
    title: "Geçersiz Kural Kaydı",
    category: "magaza",
    severity: "critical",
    platforms: ["android"],
    engines: ["any"],
    symptoms: ["hata belirtisi"],
    keywords: ["hata", "policy"],
    causes: ["neden"],
    solution: [{ step: 1, action: "Düzelt" }],
    prevention: ["Önlem"],
    tools: [],
    related: [],
    sources: [], // Empty sources for policy!
    verifiedAt: "2026-10-04",
    confidence: "policy"
  };

  assert.throws(() => {
    ProblemSchema.parse(invalidPolicy);
  }, /must contain at least 1 source/);
});

test("ProblemSchema rejects non-consecutive solution steps", () => {
  const invalidSteps = {
    id: "M-98",
    title: "Adım Hatası Kaydı",
    category: "performans",
    severity: "low",
    platforms: ["android"],
    engines: ["any"],
    symptoms: ["hata"],
    keywords: ["hata"],
    causes: ["neden"],
    solution: [
      { step: 1, action: "Adım 1" },
      { step: 3, action: "Adım 3 (2 atlandı)" }
    ],
    prevention: [],
    tools: [],
    related: [],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  };

  assert.throws(() => {
    ProblemSchema.parse(invalidSteps);
  }, /step must be 2, found 3/);
});
