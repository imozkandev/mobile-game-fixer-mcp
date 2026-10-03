import fs from "node:fs";
import path from "node:path";

const rulesPath = path.join(process.cwd(), "knowledge", "rules", "store-rules.json");
if (!fs.existsSync(rulesPath)) {
  console.error("store-rules.json bulunamadı!");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
const now = new Date();
const STALE_DAYS = 90;
let staleCount = 0;

console.log("=== Mağaza Kuralları Tazelik Denetimi ===");
for (const rule of raw) {
  const verifiedDate = new Date(rule.verifiedAt);
  const diffTime = now.getTime() - verifiedDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > STALE_DAYS) {
    console.error(`❌ [BAYAT KURAL] ${rule.id} (${rule.title}): ${diffDays} gün önce doğrulandı (Sınır: ${STALE_DAYS} gün).`);
    staleCount++;
  } else {
    console.log(`✅ [GÜNCEL] ${rule.id} (${diffDays} gün önce doğrulandı).`);
  }
}

if (staleCount > 0) {
  console.error(`\nToplam ${staleCount} adet kural 90 günden eski. Lütfen resmi kaynakları kontrol edip verifiedAt tarihlerini güncelleyin.`);
  process.exit(1);
} else {
  console.log(`\nTüm kurallar (${raw.length} adet) güncel ve taze.`);
  process.exit(0);
}
