import test from "node:test";
import assert from "node:assert/strict";
import { makeReport } from "../dist/core/types.js";

test("makeReport sets ok to true when there are no errors", () => {
  const report = makeReport("test_tool", [
    { severity: "warning", rule: "rule-1", message: "warning message" },
    { severity: "info", rule: "rule-2", message: "info message" }
  ]);

  assert.equal(report.ok, true);
  assert.equal(report.tool, "test_tool");
  assert.equal(report.findings.length, 2);
  assert.match(report.summary, /1 warning\(s\), 1 info notice\(s\)/);
});

test("makeReport sets ok to false when there is at least one error", () => {
  const report = makeReport("test_tool", [
    { severity: "error", rule: "rule-err", message: "critical error" },
    { severity: "warning", rule: "rule-warn", message: "some warning" }
  ]);

  assert.equal(report.ok, false);
  assert.equal(report.findings.length, 2);
  assert.match(report.summary, /1 error\(s\), 1 warning\(s\)/);
});
