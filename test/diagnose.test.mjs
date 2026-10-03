import test from "node:test";
import assert from "node:assert/strict";
import { diagnose, normalize, tokenize } from "../dist/core/search.js";

const GOLD_TESTS = [
  { query: "oyun 10 dakika sonra ısınıyor ve FPS düşüyor", expectedId: "M-01" },
  { query: "isiniyor fps dusuyor", expectedId: "M-01" },
  { query: "game overheats and drops frames", expectedId: "M-01" },
  { query: "düşük ram'li telefonlarda oyun kendi kendine kapanıyor", expectedId: "M-02" },
  { query: "oyun arada donuyor, GC", expectedId: "M-03" },
  { query: "güncelleme play'e yüklenmiyor target api hatası", expectedId: "M-10" },
  { query: "native kütüphane 16 kb hatası", expectedId: "M-11" },
  { query: "apple privacy manifest yüzünden reddedildi", expectedId: "M-13" },
  { query: "loot box oranları gösterilmediği için reddedildi", expectedId: "M-16" },
  { query: "para çekildi ama ürün gelmedi", expectedId: "M-20" },
  { query: "oyuncular 7. seviyede bırakıyor", expectedId: "M-22" },
  { query: "yeni telefonda ilerleme sıfırlandı", expectedId: "M-25" },
  { query: "çökme oranı vitals eşiğine yaklaştı", expectedId: "M-28" },
  { query: "lansmanda sunucu çöktü", expectedId: "M-32" },
  { query: "türkçe büyük harf i sorunu", expectedId: "M-35" },
  { query: "hata var ama mağaza onayı beklemek istemiyorum", expectedId: "M-40" }
];

test("All 16 Gold Queries match expected problem in top 3", () => {
  for (const { query, expectedId } of GOLD_TESTS) {
    const report = diagnose({ symptom: query, limit: 3 });
    assert.ok(report.data, `Report data missing for query: "${query}"`);
    const matchIds = report.data.matches.map((m) => m.id);
    assert.ok(
      matchIds.includes(expectedId),
      `Query "${query}" expected ${expectedId} in top 3, but got: [${matchIds.join(", ")}]`
    );
  }
});

test("Nonsense / unrelated query returns empty matches", () => {
  const unrelated = ["bugün hava nasıl", "asdfghjkl", "merhaba nasılsın", "kek tarifi"];
  for (const q of unrelated) {
    const report = diagnose({ symptom: q });
    assert.ok(report.data);
    assert.equal(
      report.data.matches.length,
      0,
      `Query "${q}" should return 0 matches, but returned ${report.data.matches.length}`
    );
  }
});

test("Additional English queries match properly", () => {
  const enTests = [
    { query: "out of memory crash on 2GB devices", expectedId: "M-02" },
    { query: "app tracking transparency missing key", expectedId: "M-14" },
    { query: "players quitting at level 7", expectedId: "M-22" },
    { query: "save progress reset on new phone", expectedId: "M-25" },
    { query: "server down on launch day with 503 error", expectedId: "M-32" }
  ];

  for (const { query, expectedId } of enTests) {
    const report = diagnose({ symptom: query, limit: 3 });
    assert.ok(report.data);
    const matchIds = report.data.matches.map((m) => m.id);
    assert.ok(
      matchIds.includes(expectedId),
      `English Query "${query}" expected ${expectedId} in top 3, but got: [${matchIds.join(", ")}]`
    );
  }
});

test("Turkish normalization and accent folding", () => {
  assert.equal(normalize("IŞIK ÇÖPÜ ĞÜVERCİN"), "isik copu guvercin");
  assert.equal(normalize("İstisna ve Çökme"), "istisna ve cokme");
  const tokens = tokenize("Oyun 10 dakika sonra ısınıyor ve donuyor!");
  assert.ok(tokens.includes("isiniyor"));
  assert.ok(tokens.includes("donuyor"));
  assert.ok(!tokens.includes("ve"), "Stop word 've' should be omitted");
});
