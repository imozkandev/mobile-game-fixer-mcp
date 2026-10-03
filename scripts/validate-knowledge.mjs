import fs from "node:fs";
import path from "node:path";
import {
  ProblemSchema,
  RuleSchema,
  ChecklistItemSchema,
  RunbookSchema,
  SynonymsSchema
} from "../dist/knowledge.js";
import { z } from "zod";

const rootDir = process.cwd();
const problemsDir = path.join(rootDir, "knowledge", "problems");
const rulesFile = path.join(rootDir, "knowledge", "rules", "store-rules.json");
const checklistFile = path.join(rootDir, "knowledge", "checklists", "prelaunch.json");
const runbookFile = path.join(rootDir, "knowledge", "runbooks", "launch-day.json");
const synonymsFile = path.join(rootDir, "knowledge", "synonyms.json");

let errors = 0;
const problemIds = new Set();

// 1. Validate Problems
if (!fs.existsSync(problemsDir)) {
  console.error("Missing knowledge/problems directory!");
  process.exit(1);
}

const problemFiles = fs.readdirSync(problemsDir).filter((f) => f.endsWith(".json"));
if (problemFiles.length === 0) {
  console.error("No problem JSON files found!");
  process.exit(1);
}

const loadedProblems = [];
for (const file of problemFiles) {
  const filePath = path.join(problemsDir, file);
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const parsed = ProblemSchema.parse(raw);
    const expectedId = path.basename(file, ".json");
    if (parsed.id !== expectedId) {
      console.error(`ID mismatch in ${file}: expected ${expectedId}, got ${parsed.id}`);
      errors++;
    }
    problemIds.add(parsed.id);
    loadedProblems.push(parsed);
  } catch (err) {
    console.error(`Validation error in ${file}:`, err);
    errors++;
  }
}

// Check related IDs
for (const p of loadedProblems) {
  for (const relId of p.related) {
    if (!problemIds.has(relId)) {
      console.error(`Problem ${p.id} references non-existent related ID: ${relId}`);
      errors++;
    }
  }
}

// 2. Validate Rules
if (fs.existsSync(rulesFile)) {
  try {
    const raw = JSON.parse(fs.readFileSync(rulesFile, "utf-8"));
    const parsedRules = z.array(RuleSchema).parse(raw);
    for (const r of parsedRules) {
      for (const pId of r.problemIds) {
        if (!problemIds.has(pId)) {
          console.error(`Rule ${r.id} references non-existent problemId: ${pId}`);
          errors++;
        }
      }
    }
  } catch (err) {
    console.error(`Validation error in ${rulesFile}:`, err);
    errors++;
  }
} else {
  console.error(`Missing ${rulesFile}`);
  errors++;
}

// 3. Validate Checklist
if (fs.existsSync(checklistFile)) {
  try {
    const raw = JSON.parse(fs.readFileSync(checklistFile, "utf-8"));
    const parsedChecklist = z.array(ChecklistItemSchema).parse(raw);
    for (const c of parsedChecklist) {
      for (const pId of c.problemIds) {
        if (!problemIds.has(pId)) {
          console.error(`Checklist item ${c.id} references non-existent problemId: ${pId}`);
          errors++;
        }
      }
    }
  } catch (err) {
    console.error(`Validation error in ${checklistFile}:`, err);
    errors++;
  }
}

// 4. Validate Runbook
if (fs.existsSync(runbookFile)) {
  try {
    const raw = JSON.parse(fs.readFileSync(runbookFile, "utf-8"));
    RunbookSchema.parse(raw);
  } catch (err) {
    console.error(`Validation error in ${runbookFile}:`, err);
    errors++;
  }
}

// 5. Validate Synonyms
if (fs.existsSync(synonymsFile)) {
  try {
    const raw = JSON.parse(fs.readFileSync(synonymsFile, "utf-8"));
    SynonymsSchema.parse(raw);
    if (Object.keys(raw).length < 15) {
      console.error(`synonyms.json must have at least 15 synonym groups, found ${Object.keys(raw).length}`);
      errors++;
    }
  } catch (err) {
    console.error(`Validation error in ${synonymsFile}:`, err);
    errors++;
  }
}

if (errors > 0) {
  console.error(`Knowledge validation failed with ${errors} errors.`);
  process.exit(1);
} else {
  console.log(`Knowledge validation passed: ${problemFiles.length} problems, rules, checklists, runbooks, and synonyms verified.`);
  process.exit(0);
}
