import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { diagnose } from "../dist/core/search.js";

/**
 * Benchmark Evaluation Dataset for Mobile Game AI Agent
 */
const EVAL_DATASET = [
  // 1. Performance & Thermal
  {
    id: "eval-01",
    name: "Thermal Throttling Drop",
    input: { symptom: "Oyun 15 dakika oynandıktan sonra telefon aşırı ısınıyor ve kare hızı 60'tan 25'e düşüyor" },
    expectedTopId: "M-01",
    category: "performance"
  },
  {
    id: "eval-02",
    name: "English Overheating",
    input: { symptom: "Game gets hot after 10 minutes and FPS drops drastically on budget phones" },
    expectedTopId: "M-01",
    category: "performance"
  },
  {
    id: "eval-03",
    name: "GC Allocation Spikes",
    input: { symptom: "Oyun her 3 saniyede bir milisaniyelik mikro takılma yaşıyor, profiler'da GC.Alloc tavan yapıyor" },
    expectedTopId: "M-03",
    category: "performance"
  },
  {
    id: "eval-04",
    name: "Shader Compilation Lag",
    input: { symptom: "Yeni bir partikül veya büyü ilk defa ekranda patladığında yarım saniye donma oluyor sonra düzeliyor" },
    expectedTopId: "M-06",
    category: "performance"
  },

  // 2. Memory & Crash
  {
    id: "eval-05",
    name: "Low RAM OOM Termination",
    input: { symptom: "2GB ve 3GB RAM'li ucuz telefonlarda oyun sahne geçişinde sessizce masaüstüne kapanıyor" },
    expectedTopId: "M-02",
    category: "memory_crash"
  },
  {
    id: "eval-06",
    name: "iOS Native SIGSEGV Crash",
    input: { symptom: "iPhone'larda Xcode EXC_BAD_ACCESS KERN_INVALID_ADDRESS hatasıyla yerel çökme yaşanıyor" },
    expectedTopId: "M-29",
    category: "memory_crash"
  },
  {
    id: "eval-07",
    name: "Android Vitals Threshold Exceeded",
    input: { symptom: "Play Console panelinde çökme ve ANR oranı vitals bad behavior eşiğini aştı uyarısı geldi" },
    expectedTopId: "M-28",
    category: "memory_crash"
  },

  // 3. Store Policy & Compliance
  {
    id: "eval-08",
    name: "Google Play Target API 35 Requirement",
    input: { symptom: "Google Play Console yeni bundle yüklerken target api level hatası veriyor ve reddediyor" },
    expectedTopId: "M-10",
    category: "store_policy"
  },
  {
    id: "eval-09",
    name: "16 KB Page Size Alignment Error",
    input: { symptom: "Native C++ kütüphanemiz libgame.so için 16 KB sayfa boyutu hizalama hatası alıyoruz" },
    expectedTopId: "M-11",
    category: "store_policy"
  },
  {
    id: "eval-10",
    name: "iOS Privacy Manifest Missing Reasons",
    input: { symptom: "Apple App Store ITMS-91053 Privacy Manifest Required Reason API eksikliği nedeniyle reddetti" },
    expectedTopId: "M-13",
    category: "store_policy"
  },
  {
    id: "eval-11",
    name: "App Tracking Transparency IDFA Missing",
    input: { symptom: "Guideline 5.1.2 ATT izni istemeden reklam kimliği okunduğu için onay alamadık" },
    expectedTopId: "M-14",
    category: "store_policy"
  },
  {
    id: "eval-12",
    name: "Gacha Loot Box Rates Undisclosed",
    input: { symptom: "Kasa açma ve şans çarkı mekaniğinde drop oranları gösterilmediği için mağaza reddi aldık" },
    expectedTopId: "M-16",
    category: "store_policy"
  },

  // 4. Live-Ops & IAP
  {
    id: "eval-13",
    name: "IAP Payment Deducted Item Not Delivered",
    input: { symptom: "Kullanıcıdan para çekildi ama internet koptuğu için oyun içi elmaslar hesaba geçmedi" },
    expectedTopId: "M-20",
    category: "liveops_iap"
  },
  {
    id: "eval-14",
    name: "Save Data Loss Across Devices",
    input: { symptom: "Kullanıcı yeni telefona geçiş yaptığında kayıtlı oyun ilerlemesi sıfırlandı ve 1. seviyeye döndü" },
    expectedTopId: "M-25",
    category: "liveops_iap"
  },
  {
    id: "eval-15",
    name: "Save Schema Migration Failure",
    input: { symptom: "Oyunu son sürüme güncelleyen eski oyuncuların envanteri silindi ve save JSON parse hatası verdi" },
    expectedTopId: "M-26",
    category: "liveops_iap"
  },
  {
    id: "eval-16",
    name: "Kill Switch Remote Config Panic",
    input: { symptom: "Canlıda mini oyunda açık bulundu, mağaza güncellemesi beklemeden acil özelliği kapatmamız lazım" },
    expectedTopId: "M-40",
    category: "liveops_iap"
  },
  {
    id: "eval-17",
    name: "Level Churn Funnel Drop",
    input: { symptom: "Funnel analitiğinde oyuncular 7. seviyede oyunu topluca terk ediyor ve siliyor" },
    expectedTopId: "M-22",
    category: "liveops_iap"
  },

  // 5. Localization & Device Edge Cases
  {
    id: "eval-18",
    name: "Turkish i Upper/Lowercase Case Bug",
    input: { symptom: "Cihaz dili Türkçe olunca ToUpper 'ITEM_ID' yerine 'İTEM_İD' yapıyor ve anahtar bulunamıyor" },
    expectedTopId: "M-35",
    category: "localization"
  },
  {
    id: "eval-19",
    name: "RTL Arabic Text Disjointed",
    input: { symptom: "Arapça çeviride harfler ters sırada diziliyor ve birleşmeyip UI'dan taşıyor" },
    expectedTopId: "M-36",
    category: "localization"
  },
  {
    id: "eval-20",
    name: "Bluetooth Disconnect Audio Mute",
    input: { symptom: "Oyuncu AirPods veya kablosuz kulaklığı çıkardığında oyunun tüm sesi gidiyor ve geri gelmiyor" },
    expectedTopId: "M-39",
    category: "device_notch"
  }
];

export function runEvals() {
  const results = [];
  let top1Count = 0;
  let top3Count = 0;
  let totalLatency = 0;

  for (const test of EVAL_DATASET) {
    const startTime = performance.now();
    const report = diagnose(test.input);
    const latency = performance.now() - startTime;
    totalLatency += latency;

    const matches = report.data?.matches || [];
    const actualTop3 = matches.slice(0, 3).map((m) => m.id);
    const actualTopId = actualTop3[0];
    const topConfidence = matches[0]?.confidence;

    const top1Matched = actualTopId === test.expectedTopId;
    const top3Matched = actualTop3.includes(test.expectedTopId) ||
      (test.acceptableTop3Ids ? test.acceptableTop3Ids.some((id) => actualTop3.includes(id)) : false);

    const passed = top1Matched;
    if (top1Matched) top1Count++;
    if (top3Matched) top3Count++;

    let failureReason;
    if (!passed) {
      failureReason = `Expected Top-1 '${test.expectedTopId}', got Top-1 '${actualTopId || "none"}' (Top-3: [${actualTop3.join(", ")}])`;
    }

    results.push({
      testId: test.id,
      name: test.name,
      category: test.category,
      passed,
      top1Matched,
      top3Matched,
      actualTopId,
      actualTop3Ids: actualTop3,
      confidence: topConfidence,
      latencyMs: parseFloat(latency.toFixed(2)),
      failureReason
    });
  }

  const total = EVAL_DATASET.length;
  const top1Accuracy = ((top1Count / total) * 100).toFixed(1) + "%";
  const top3Accuracy = ((top3Count / total) * 100).toFixed(1) + "%";
  const avgLatencyMs = (totalLatency / total).toFixed(2) + "ms";

  return {
    summary: {
      totalTests: total,
      passed: top1Count,
      failed: total - top1Count,
      top1Accuracy,
      top3Accuracy,
      avgLatencyMs
    },
    results
  };
}

// CLI Execution
console.log("=========================================================");
console.log("🚀 MOBILE GAME FIXER - AI AGENT RETRIEVAL & DIAGNOSIS EVALS");
console.log("=========================================================\n");

const evalOutput = runEvals();

console.log(`📊 TOTAL EVALS RUN: ${evalOutput.summary.totalTests}`);
console.log(`✅ TOP-1 ACCURACY : ${evalOutput.summary.top1Accuracy} (${evalOutput.summary.passed}/${evalOutput.summary.totalTests})`);
console.log(`🎯 TOP-3 ACCURACY : ${evalOutput.summary.top3Accuracy}`);
console.log(`⚡ AVG INFERENCE  : ${evalOutput.summary.avgLatencyMs}`);
console.log("\n---------------------------------------------------------");
console.log("EVALUATION BREAKDOWN BY CASE:");
console.log("---------------------------------------------------------");

for (const res of evalOutput.results) {
  const statusIcon = res.passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${statusIcon} [${res.category.padEnd(13)}] ${res.name.padEnd(38)} -> Top: ${res.actualTopId || "None"} (${res.confidence || "-"}) [${res.latencyMs}ms]`);
  if (res.failureReason) {
    console.log(`   ⚠️ Failure: ${res.failureReason}`);
  }
}

// Save report to evals/eval-report.json
const outDir = path.join(process.cwd(), "evals");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "eval-report.json"), JSON.stringify(evalOutput, null, 2), "utf-8");
console.log(`\n📁 Eval report saved to evals/eval-report.json`);

if (evalOutput.summary.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
