import test from "node:test";
import assert from "node:assert/strict";
import { setClock, resetClock } from "../dist/clock.js";
import { upcomingDeadlines } from "../dist/core/deadlines.js";

test.beforeEach(() => {
  resetClock();
});

test.afterEach(() => {
  resetClock();
});

test("upcomingDeadlines on 2026-10-04", () => {
  setClock("2026-10-04T00:00:00Z");
  const report = upcomingDeadlines({ days: 180 });

  assert.ok(report.data);
  // play-target-api is 2026-11-01 (approx 28 days -> due-soon)
  const dueSoonIds = report.data.dueSoon.map((d) => d.ruleId);
  assert.ok(dueSoonIds.includes("play-target-api"), "play-target-api should be due-soon on 2026-10-04");

  // play-16kb-page-size is 2027-02-01 (approx 120 days -> upcoming)
  const upcomingIds = report.data.upcoming.map((d) => d.ruleId);
  assert.ok(upcomingIds.includes("play-16kb-page-size"), "play-16kb-page-size should be upcoming on 2026-10-04");
});

test("upcomingDeadlines on 2026-11-02 marks play-target-api as expired", () => {
  setClock("2026-11-02T00:00:00Z");
  const report = upcomingDeadlines({ days: 180 });

  assert.ok(report.data);
  const expiredIds = report.data.expired.map((d) => d.ruleId);
  assert.ok(expiredIds.includes("play-target-api"), "play-target-api should be expired on 2026-11-02");
  assert.equal(report.ok, false, "Report ok should be false when deadlines are expired");
});

test("upcomingDeadlines on 2027-02-02 marks play-16kb-page-size as expired", () => {
  setClock("2027-02-02T00:00:00Z");
  const report = upcomingDeadlines({ platform: "android" });

  assert.ok(report.data);
  const expiredIds = report.data.expired.map((d) => d.ruleId);
  assert.ok(expiredIds.includes("play-16kb-page-size"), "play-16kb-page-size should be expired on 2027-02-02");
});

test("upcomingDeadlines filters by platform", () => {
  setClock("2026-10-04T00:00:00Z");
  const reportIos = upcomingDeadlines({ platform: "ios" });
  assert.ok(reportIos.data);
  const allIosRules = [...reportIos.data.expired, ...reportIos.data.dueSoon, ...reportIos.data.upcoming];
  for (const r of allIosRules) {
    assert.ok(r.platform === "ios" || r.platform === "both");
  }
});
