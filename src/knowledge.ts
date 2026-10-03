import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

// 3.1 Problem Schema
export const SourceSchema = z.object({
  url: z.string().url(),
  type: z.enum(["primary", "secondary"]),
  title: z.string().optional()
});

export const ToolCoverageSchema = z.object({
  name: z.string(),
  project: z.string().optional(),
  coverage: z.enum(["full", "partial", "none"])
});

export const SolutionStepSchema = z.object({
  step: z.number().int().positive(),
  action: z.string().min(1),
  effort: z.enum(["low", "medium", "high"]).optional(),
  details: z.string().optional()
});

export const ProblemSchema = z
  .object({
    id: z.string().regex(/^M-\d{2,3}$/, "ID must match pattern ^M-\\d{2,3}$"),
    title: z.string().min(3),
    category: z.string().min(1),
    severity: z.enum(["low", "medium", "high", "critical"]),
    platforms: z.array(z.enum(["android", "ios", "any"])).min(1),
    engines: z.array(z.enum(["unity", "godot", "unreal", "any"])).min(1),
    symptoms: z.array(z.string()).min(1),
    keywords: z.array(z.string()).min(1),
    causes: z.array(z.string()).min(1),
    solution: z.array(SolutionStepSchema).min(1),
    prevention: z.array(z.string()),
    tools: z.array(ToolCoverageSchema),
    related: z.array(z.string().regex(/^M-\d{2,3}$/)),
    sources: z.array(SourceSchema),
    verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "verifiedAt must be YYYY-MM-DD"),
    confidence: z.enum(["established", "policy", "heuristic"])
  })
  .superRefine((data, ctx) => {
    // Solution steps must be consecutive starting at 1
    data.solution.forEach((step, idx) => {
      if (step.step !== idx + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `solution[${idx}].step must be ${idx + 1}, found ${step.step}`,
          path: ["solution", idx, "step"]
        });
      }
    });

    // If confidence is policy, sources must not be empty
    if (data.confidence === "policy" && data.sources.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Problems with confidence 'policy' must contain at least 1 source in sources[]",
        path: ["sources"]
      });
    }

    // If any tool has coverage === "none", or tools contains empty
    const noneTools = data.tools.filter((t) => t.coverage === "none");
    if (noneTools.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tool items with coverage 'none' should not be listed; leave tools array empty instead",
        path: ["tools"]
      });
    }
  });

export type Problem = z.infer<typeof ProblemSchema>;

// 3.2 Store Rule Schema
export const RuleSchema = z.object({
  id: z.string().min(1),
  platform: z.enum(["android", "ios", "both"]),
  title: z.string().min(1),
  appliesTo: z.string().min(1),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  kind: z.enum(["deadline", "requirement"]),
  problemIds: z.array(z.string().regex(/^M-\d{2,3}$/)),
  checkId: z.string().optional(),
  source: SourceSchema,
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export type Rule = z.infer<typeof RuleSchema>;

// Prelaunch Checklist Schema
export const ChecklistItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  area: z.string().min(1),
  platforms: z.array(z.enum(["android", "ios"])).min(1),
  requires: z
    .object({
      monetization: z.array(z.enum(["iap", "ads", "gacha"])).optional(),
      kids: z.boolean().optional()
    })
    .optional(),
  problemIds: z.array(z.string().regex(/^M-\d{2,3}$/))
});

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

// Runbook Schema
export const RunbookPhaseSchema = z.object({
  title: z.string().min(1),
  steps: z.array(z.string()).min(1),
  decisionRules: z.array(z.string()).min(1)
});

export const RunbookSchema = z.object({
  phases: z.record(RunbookPhaseSchema)
});

export type Runbook = z.infer<typeof RunbookSchema>;

// Synonyms Schema
export const SynonymsSchema = z.record(z.array(z.string()));

// Knowledge Store Loader
export class KnowledgeBase {
  private static instance: KnowledgeBase | null = null;
  public problems: Map<string, Problem> = new Map();
  public rules: Rule[] = [];
  public checklists: ChecklistItem[] = [];
  public runbook: Runbook | null = null;
  public synonyms: Record<string, string[]> = {};
  public rootDir: string;

  constructor(rootDir?: string) {
    this.rootDir = rootDir || path.resolve(process.cwd(), "knowledge");
    this.loadAll();
  }

  public static getInstance(rootDir?: string): KnowledgeBase {
    if (!KnowledgeBase.instance) {
      KnowledgeBase.instance = new KnowledgeBase(rootDir);
    }
    return KnowledgeBase.instance;
  }

  public static resetInstance(): void {
    KnowledgeBase.instance = null;
  }

  private loadAll(): void {
    const problemsDir = path.join(this.rootDir, "problems");
    if (fs.existsSync(problemsDir)) {
      const files = fs.readdirSync(problemsDir).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        const filePath = path.join(problemsDir, file);
        const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const parsed = ProblemSchema.parse(raw);
        const expectedId = path.basename(file, ".json");
        if (parsed.id !== expectedId) {
          throw new Error(`File ${file} has id ${parsed.id}, expected ${expectedId}`);
        }
        this.problems.set(parsed.id, parsed);
      }
    }

    const rulesFile = path.join(this.rootDir, "rules", "store-rules.json");
    if (fs.existsSync(rulesFile)) {
      const raw = JSON.parse(fs.readFileSync(rulesFile, "utf-8"));
      this.rules = z.array(RuleSchema).parse(raw);
    }

    const checklistFile = path.join(this.rootDir, "checklists", "prelaunch.json");
    if (fs.existsSync(checklistFile)) {
      const raw = JSON.parse(fs.readFileSync(checklistFile, "utf-8"));
      this.checklists = z.array(ChecklistItemSchema).parse(raw);
    }

    const runbookFile = path.join(this.rootDir, "runbooks", "launch-day.json");
    if (fs.existsSync(runbookFile)) {
      const raw = JSON.parse(fs.readFileSync(runbookFile, "utf-8"));
      this.runbook = RunbookSchema.parse(raw);
    }

    const synonymsFile = path.join(this.rootDir, "synonyms.json");
    if (fs.existsSync(synonymsFile)) {
      const raw = JSON.parse(fs.readFileSync(synonymsFile, "utf-8"));
      this.synonyms = SynonymsSchema.parse(raw);
    }
  }

  public getProblem(id: string): Problem | undefined {
    return this.problems.get(id);
  }

  public getAllProblems(): Problem[] {
    return Array.from(this.problems.values());
  }

  public getAllRules(): Rule[] {
    return this.rules;
  }

  public getAllChecklists(): ChecklistItem[] {
    return this.checklists;
  }

  public getRunbook(): Runbook | null {
    return this.runbook;
  }

  public getSynonyms(): Record<string, string[]> {
    return this.synonyms;
  }
}
