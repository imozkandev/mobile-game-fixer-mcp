import path from "node:path";
import fs from "node:fs";

// Resolve knowledge directory
export function getKnowledgeDir(): string {
  const directPath = path.resolve(process.cwd(), "knowledge");
  if (fs.existsSync(directPath)) return directPath;
  const parentPath = path.resolve(process.cwd(), "..", "knowledge");
  if (fs.existsSync(parentPath)) return parentPath;
  return path.resolve(process.cwd(), "knowledge");
}

export function getProjectRootDir(): string {
  const directPath = path.resolve(process.cwd(), "package.json");
  if (fs.existsSync(directPath)) {
    const pkg = JSON.parse(fs.readFileSync(directPath, "utf-8"));
    if (pkg.name === "mobile-game-fixer-mcp") return process.cwd();
  }
  return path.resolve(process.cwd(), "..");
}
