import test, { before } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { checkStoreCompliance } from "../dist/core/compliance/index.js";

const fixturesDir = path.join(process.cwd(), "test", "fixtures");

before(() => {
  // Ensure android-bad sensitive test fixture files exist even if excluded by git
  const androidBadDir = path.join(fixturesDir, "android-bad");
  if (fs.existsSync(androidBadDir)) {
    fs.writeFileSync(path.join(androidBadDir, "release.keystore"), "DUMMY_KEYSTORE_CONTENT");
    fs.writeFileSync(path.join(androidBadDir, ".env"), "SECRET_API_KEY=12345");
  }
});

test("Android Good fixture passes all checks", () => {
  const goodPath = path.join(fixturesDir, "android-good");
  const report = checkStoreCompliance({
    projectPath: goodPath,
    platform: "android"
  });

  assert.equal(report.ok, true, `Expected ok: true, but findings: ${JSON.stringify(report.findings)}`);
  assert.ok(report.data);
  assert.equal(report.data.android?.targetSdk, 35);
  assert.equal(report.data.android?.soFilesChecked, 1);
});

test("Android Bad fixture reports targetSdk, exported, and 16KB ELF errors", () => {
  const badPath = path.join(fixturesDir, "android-bad");
  const report = checkStoreCompliance({
    projectPath: badPath,
    platform: "android"
  });

  assert.equal(report.ok, false);
  const ruleIds = report.findings.map((f) => f.rule);

  // play-target-api
  assert.ok(ruleIds.includes("play-target-api"), "Should report targetSdk error");
  // android-manifest-exported-missing
  assert.ok(ruleIds.includes("android-manifest-exported-missing"), "Should report exported error");
  // play-16kb-page-size
  assert.ok(ruleIds.includes("play-16kb-page-size"), "Should report 16KB ELF alignment error");

  // Sensitive files skipped check (.keystore, .env)
  assert.ok(report.data && report.data.sensitiveFilesSkipped >= 2, "Should skip sensitive files");
});

test("iOS Good fixture passes all checks", () => {
  const goodPath = path.join(fixturesDir, "ios-good");
  const report = checkStoreCompliance({
    projectPath: goodPath,
    platform: "ios",
    xcodeVersion: 16
  });

  assert.equal(report.ok, true);
  assert.ok(report.data?.ios?.privacyManifestFound);
  assert.ok(report.data?.ios?.attDescriptionFound);
});

test("iOS Bad fixture reports empty privacy reason and missing ATT description", () => {
  const badPath = path.join(fixturesDir, "ios-bad");
  const report = checkStoreCompliance({
    projectPath: badPath,
    platform: "ios",
    xcodeVersion: 15 // old xcode
  });

  assert.equal(report.ok, false);
  const ruleIds = report.findings.map((f) => f.rule);

  assert.ok(ruleIds.includes("ios-privacy-manifest-empty-reason"));
  assert.ok(ruleIds.includes("ios-att-missing-description"));
  assert.ok(ruleIds.includes("ios-xcode-sdk-version"));
});

test("Platform 'both' checks both platforms in one report", () => {
  const badPath = path.join(fixturesDir, "android-bad");
  const report = checkStoreCompliance({
    projectPath: badPath,
    platform: "both"
  });

  assert.ok(report.data);
  assert.ok(report.data.android);
  assert.ok(report.data.ios);
});

test("Invalid / non-existent directory returns io-error report cleanly without throwing", () => {
  const report = checkStoreCompliance({
    projectPath: "/path/to/non/existent/project/dir",
    platform: "android"
  });

  assert.equal(report.ok, false);
  assert.ok(report.findings.some((f) => f.rule === "io-error"));
});
