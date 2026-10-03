import test from "node:test";
import assert from "node:assert/strict";
import { getPrelaunchChecklist, getLaunchRunbook } from "../dist/core/checklist.js";

test("getPrelaunchChecklist filters by platform", () => {
  const androidRep = getPrelaunchChecklist({ platform: "android" });
  assert.ok(androidRep.ok);
  assert.ok(androidRep.data);
  const items = androidRep.data.items;
  assert.ok(items.some((i) => i.id === "chk-target-sdk"));
  assert.ok(!items.some((i) => i.id === "chk-privacy-manifest"), "iOS-only item should not be in Android list");

  const iosRep = getPrelaunchChecklist({ platform: "ios" });
  assert.ok(iosRep.data);
  assert.ok(iosRep.data.items.some((i) => i.id === "chk-privacy-manifest"));
});

test("getPrelaunchChecklist filters by monetization and kids", () => {
  const gachaRep = getPrelaunchChecklist({ platform: "android", monetization: ["gacha"] });
  assert.ok(gachaRep.data);
  assert.ok(gachaRep.data.items.some((i) => i.id === "chk-loot-box-rates"), "Gacha should include loot box check");

  const noGachaRep = getPrelaunchChecklist({ platform: "android", monetization: ["ads"] });
  assert.ok(noGachaRep.data);
  assert.ok(!noGachaRep.data.items.some((i) => i.id === "chk-loot-box-rates"), "Non-gacha should not include loot box check");

  const kidsRep = getPrelaunchChecklist({ platform: "android", kids: true });
  assert.ok(kidsRep.data);
  assert.ok(kidsRep.data.items.some((i) => i.id === "chk-kids-coppa-policy"));

  const noKidsRep = getPrelaunchChecklist({ platform: "android", kids: false });
  assert.ok(noKidsRep.data);
  assert.ok(!noKidsRep.data.items.some((i) => i.id === "chk-kids-coppa-policy"));
});

test("getLaunchRunbook retrieves all or specific phase and handles invalid phase gracefully", () => {
  const allRep = getLaunchRunbook();
  assert.ok(allRep.ok);
  assert.ok(allRep.data);
  assert.equal(Object.keys(allRep.data.phases).length, 4);

  const t1Rep = getLaunchRunbook({ phase: "t-1" });
  assert.ok(t1Rep.ok);
  assert.ok(t1Rep.data);
  assert.equal(Object.keys(t1Rep.data.phases).length, 1);
  assert.equal(t1Rep.data.phases["t-1"].title, "1 Day Before Launch (T-1)");

  // Invalid phase
  // @ts-ignore
  const invalidRep = getLaunchRunbook({ phase: "invalid-phase" });
  assert.equal(invalidRep.ok, false);
  assert.ok(invalidRep.findings.some((f) => f.rule === "invalid-phase"));
});
