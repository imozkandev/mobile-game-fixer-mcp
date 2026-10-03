import fs from "node:fs";
import path from "node:path";

const rulesPath = path.join(process.cwd(), "knowledge", "rules", "store-rules.json");
if (!fs.existsSync(rulesPath)) {
  console.error("store-rules.json not found!");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
const now = new Date();
const STALE_DAYS = 90;
let staleCount = 0;

console.log("=== Store Rules Freshness Verification ===");
for (const rule of raw) {
  const verifiedDate = new Date(rule.verifiedAt);
  const diffTime = now.getTime() - verifiedDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > STALE_DAYS) {
    console.error(`❌ [STALE RULE] ${rule.id} (${rule.title}): verified ${diffDays} days ago (Threshold: ${STALE_DAYS} days).`);
    staleCount++;
  } else {
    console.log(`✅ [FRESH] ${rule.id} (verified ${Math.abs(diffDays)} day(s) ago).`);
  }
}

if (staleCount > 0) {
  console.error(`\nFound ${staleCount} stale rule(s) older than 90 days. Please verify official documentation and update verifiedAt dates.`);
  process.exit(1);
} else {
  console.log(`\nAll ${raw.length} store rules verified fresh.`);
  process.exit(0);
}
