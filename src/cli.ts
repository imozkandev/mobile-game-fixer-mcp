#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { KnowledgeBase } from "./knowledge.js";
import { diagnose } from "./core/search.js";
import { upcomingDeadlines } from "./core/deadlines.js";
import { getPrelaunchChecklist, getLaunchRunbook } from "./core/checklist.js";
import { checkStoreCompliance } from "./core/compliance/index.js";
import { makeReport, Report } from "./core/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load Knowledge Base
let kb: KnowledgeBase;
try {
  kb = KnowledgeBase.getInstance(path.join(rootDir, "knowledge"));
} catch (err: any) {
  console.error(`Failed to load knowledge base: ${err.message}`);
  process.exit(2);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const isJson = args.includes("--json");
const isStrict = args.includes("--strict");
const cleanArgs = args.filter((a) => a !== "--json" && a !== "--strict");

function getFlagValue(flagName: string): string | undefined {
  const idx = cleanArgs.indexOf(flagName);
  if (idx !== -1 && idx + 1 < cleanArgs.length) {
    return cleanArgs[idx + 1];
  }
  return undefined;
}

function handleOutput<T>(report: Report<T>) {
  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`\n=== ${report.tool.toUpperCase()} ===`);
    console.log(`Status : ${report.ok ? "✅ SUCCESS" : "⚠️ ERROR / REVIEW REQUIRED"}`);
    console.log(`Summary: ${report.summary}\n`);

    if (report.findings.length > 0) {
      console.log("Findings:");
      for (const f of report.findings) {
        const icon = f.severity === "error" ? "❌" : f.severity === "warning" ? "⚠️" : "ℹ️";
        console.log(`  ${icon} [${f.rule}] ${f.message}`);
        if (f.fix) {
          console.log(`     💡 Fix: ${f.fix}`);
        }
      }
      console.log("");
    }
  }

  const hasErrors = !report.ok;
  const hasWarnings = report.findings.some((f) => f.severity === "warning");

  if (hasErrors || (isStrict && hasWarnings)) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

const command = cleanArgs[0];

switch (command) {
  case "diagnose": {
    const symptom = cleanArgs[1];
    if (!symptom) {
      console.error("Error: Symptom query not provided. Example: mobile-game-fixer diagnose \"game heats up\"");
      process.exit(2);
    }
    const platform = getFlagValue("--platform") as any;
    const engine = getFlagValue("--engine") as any;
    const limitStr = getFlagValue("--limit");
    const limit = limitStr ? parseInt(limitStr, 10) : 3;

    const report = diagnose({ symptom, platform, engine, limit });
    handleOutput(report);
    break;
  }

  case "problem": {
    const id = cleanArgs[1];
    if (!id) {
      console.error("Error: Problem ID not provided. Example: mobile-game-fixer problem M-01");
      process.exit(2);
    }
    const problem = kb.getProblem(id.toUpperCase());
    if (!problem) {
      const report = makeReport("get_problem", [
        { severity: "error", rule: "not-found", message: `'${id}' not found.` }
      ], `'${id}' record not found.`);
      handleOutput(report);
    } else {
      if (isJson) {
        console.log(JSON.stringify(problem, null, 2));
      } else {
        console.log(`\n[${problem.id}] ${problem.title}`);
        console.log(`Category: ${problem.category} | Severity: ${problem.severity} | Confidence: ${problem.confidence}`);
        console.log(`Platforms: ${problem.platforms.join(", ")} | Engines: ${problem.engines.join(", ")}`);
        console.log("\nSymptoms:\n" + problem.symptoms.map((s) => `  - ${s}`).join("\n"));
        console.log("\nCauses:\n" + problem.causes.map((c) => `  - ${c}`).join("\n"));
        console.log("\nSolution Steps:\n" + problem.solution.map((s) => `  ${s.step}. ${s.action} (${s.effort || "effort"})`).join("\n"));
        if (problem.prevention.length > 0) {
          console.log("\nPrevention:\n" + problem.prevention.map((pr) => `  - ${pr}`).join("\n"));
        }
        if (problem.sources.length > 0) {
          console.log("\nSources:\n" + problem.sources.map((src) => `  - ${src.url} (${src.type})`).join("\n"));
        }
      }
      process.exit(0);
    }
    break;
  }

  case "list": {
    const category = getFlagValue("--category");
    const platform = getFlagValue("--platform") as any;
    const confidence = getFlagValue("--confidence") as any;

    let list = kb.getAllProblems();
    if (category) list = list.filter((p) => p.category.toLowerCase().includes(category.toLowerCase()));
    if (platform) list = list.filter((p) => p.platforms.includes(platform) || p.platforms.includes("any"));
    if (confidence) list = list.filter((p) => p.confidence === confidence);

    const summaryList = list.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      severity: p.severity,
      confidence: p.confidence
    }));

    const report = makeReport("list_problems", [], `Listed ${summaryList.length} problem records.`, {
      total: summaryList.length,
      problems: summaryList
    });
    handleOutput(report);
    break;
  }

  case "deadlines": {
    const daysStr = getFlagValue("--days");
    const days = daysStr ? parseInt(daysStr, 10) : 180;
    const platform = getFlagValue("--platform") as any;

    const report = upcomingDeadlines({ days, platform });
    handleOutput(report);
    break;
  }

  case "checklist": {
    const platform = (getFlagValue("--platform") || "both") as any;
    const monStr = getFlagValue("--monetization");
    const monetization = monStr ? (monStr.split(",") as any) : undefined;
    const kids = cleanArgs.includes("--kids");
    const genre = getFlagValue("--genre");

    const report = getPrelaunchChecklist({ platform, monetization, kids, genre });
    handleOutput(report);
    break;
  }

  case "runbook": {
    const phase = getFlagValue("--phase") as any;
    const report = getLaunchRunbook({ phase });
    handleOutput(report);
    break;
  }

  case "compliance": {
    const projectPath = cleanArgs[1];
    if (!projectPath) {
      console.error("Error: Project directory not provided. Example: mobile-game-fixer compliance ./my-project --platform android");
      process.exit(2);
    }
    const platform = (getFlagValue("--platform") || "both") as any;
    const xcodeStr = getFlagValue("--xcode-version");
    const xcodeVersion = xcodeStr ? parseInt(xcodeStr, 10) : undefined;

    const resolvedPath = path.isAbsolute(projectPath) ? projectPath : path.resolve(process.cwd(), projectPath);
    const report = checkStoreCompliance({ projectPath: resolvedPath, platform, xcodeVersion });
    handleOutput(report);
    break;
  }

  default:
    console.error(`Unknown command: '${command}'. Run with --help for usage.`);
    process.exit(2);
}

function printHelp() {
  console.log(`
Mobile Game Fixer CLI - Mobile Game Troubleshooting & Store Compliance Tool

Usage:
  mobile-game-fixer diagnose "<symptom>" [--platform android|ios] [--engine unity|godot|unreal] [--limit 3]
  mobile-game-fixer problem <id> (e.g. M-01)
  mobile-game-fixer list [--category <category>] [--platform android|ios] [--confidence established|policy|heuristic]
  mobile-game-fixer deadlines [--days 180] [--platform android|ios|both]
  mobile-game-fixer checklist --platform android|ios|both [--monetization iap,ads,gacha] [--kids]
  mobile-game-fixer runbook [--phase t-1|hour-1|hour-6|day-1]
  mobile-game-fixer compliance <projectDir> --platform android|ios|both [--xcode-version 16]

Options:
  --json     Output raw JSON report format.
  --strict   Exit with code 1 on warnings as well as errors.
  --help     Show this help screen.
`);
}
