import { Finding } from "../types.js";
import { KnowledgeBase } from "../../knowledge.js";
import { safeReadFile, ScanResult } from "./fs.js";

export interface IosComplianceOptions {
  xcodeVersion?: number;
}

export interface IosComplianceResult {
  findings: Finding[];
  privacyManifestFound: boolean;
  attUsedInCode: boolean;
  attDescriptionFound: boolean;
}

export function checkIosCompliance(scan: ScanResult, options: IosComplianceOptions = {}): IosComplianceResult {
  const { xcodeVersion } = options;
  const findings: Finding[] = [];
  const kb = KnowledgeBase.getInstance();
  const rules = kb.getAllRules();
  const privacyRule = rules.find((r) => r.id === "ios-privacy-manifest");
  const xcodeRule = rules.find((r) => r.id === "ios-xcode-sdk-version");

  let privacyManifestFound = false;
  let attUsedInCode = false;
  let attDescriptionFound = false;

  // 1. Check Info.plist
  const plistFiles = scan.files.filter((f) => f.endsWith("Info.plist") || f.endsWith(".plist"));
  for (const pFile of plistFiles) {
    const buf = safeReadFile(scan.rootPath, pFile);
    if (!buf) continue;

    // Binary plist check
    if (buf.length >= 8 && buf.toString("ascii", 0, 6) === "bplist") {
      findings.push({
        severity: "info",
        rule: "ios-binary-plist",
        message: `${pFile}: Binary plist format detected. Convert with 'plutil -convert xml1 ${pFile}' for static inspection.`
      });
      continue;
    }

    const xml = buf.toString("utf-8");
    if (xml.includes("NSUserTrackingUsageDescription")) {
      attDescriptionFound = true;
      findings.push({
        severity: "info",
        rule: "ios-att-description",
        message: `${pFile}: NSUserTrackingUsageDescription key found in Info.plist.`,
        problemId: "M-14"
      });
    }
  }

  // 2. Check source files for ATTrackingManager usage
  const codeFiles = scan.files.filter((f) =>
    f.endsWith(".swift") ||
    f.endsWith(".m") ||
    f.endsWith(".mm") ||
    f.endsWith(".cs")
  );

  for (const cFile of codeFiles) {
    const buf = safeReadFile(scan.rootPath, cFile);
    if (!buf) continue;
    const code = buf.toString("utf-8");

    if (code.includes("ATTrackingManager")) {
      attUsedInCode = true;
      break;
    }
  }

  if (attUsedInCode) {
    if (!attDescriptionFound) {
      findings.push({
        severity: "error",
        rule: "ios-att-missing-description",
        message: "Source code references ATTrackingManager (ATT), but Info.plist is missing NSUserTrackingUsageDescription.",
        fix: "Add NSUserTrackingUsageDescription key with a clear user-facing explanation in Info.plist.",
        problemId: "M-14",
        deadline: undefined
      });
    }
  }

  // 3. Check PrivacyInfo.xcprivacy
  const privacyFiles = scan.files.filter((f) => f.endsWith("PrivacyInfo.xcprivacy") || f.endsWith("privacyinfo.xcprivacy"));
  if (privacyFiles.length === 0) {
    findings.push({
      severity: "warning",
      rule: privacyRule?.id || "ios-privacy-manifest-missing",
      message: "No PrivacyInfo.xcprivacy (Apple Privacy Manifest) file detected in project directory.",
      fix: "Add PrivacyInfo.xcprivacy to your Xcode project root declaring all Required Reason APIs used.",
      problemId: "M-13",
      deadline: privacyRule?.effectiveDate,
      sourceType: privacyRule?.source.type
    });
  } else {
    privacyManifestFound = true;
    for (const pFile of privacyFiles) {
      const buf = safeReadFile(scan.rootPath, pFile);
      if (!buf) continue;
      const content = buf.toString("utf-8");

      if (content.includes("NSPrivacyAccessedAPITypes")) {
        const hasEmptyReason =
          /<key>NSPrivacyAccessedAPITypeReasons<\/key>\s*<array\s*\/>/i.test(content) ||
          /<key>NSPrivacyAccessedAPITypeReasons<\/key>\s*<array>\s*<\/array>/i.test(content) ||
          /"NSPrivacyAccessedAPITypeReasons"\s*:\s*\[\s*\]/i.test(content);

        if (hasEmptyReason) {
          findings.push({
            severity: "error",
            rule: "ios-privacy-manifest-empty-reason",
            message: `${pFile}: Declared NSPrivacyAccessedAPITypes entry has empty NSPrivacyAccessedAPITypeReasons.`,
            fix: "Select at least one approved Apple standard reason code for every accessed API category.",
            problemId: "M-13",
            deadline: privacyRule?.effectiveDate,
            sourceType: privacyRule?.source.type
          });
        } else {
          findings.push({
            severity: "info",
            rule: "ios-privacy-manifest-valid",
            message: `${pFile}: Apple Privacy Manifest and non-empty reasons validated.`,
            problemId: "M-13"
          });
        }
      }
    }
  }

  // 4. Xcode Version Check
  if (xcodeVersion !== undefined) {
    const MIN_XCODE_VERSION = 16;
    if (xcodeVersion < MIN_XCODE_VERSION) {
      findings.push({
        severity: "error",
        rule: xcodeRule?.id || "ios-xcode-sdk-version",
        message: `Specified Xcode version is ${xcodeVersion}. App Store mandates at least Xcode ${MIN_XCODE_VERSION}+.`,
        fix: `Compile release builds using Xcode ${MIN_XCODE_VERSION} or later.`,
        problemId: "M-13",
        deadline: xcodeRule?.effectiveDate,
        sourceType: xcodeRule?.source.type
      });
    } else {
      findings.push({
        severity: "info",
        rule: "ios-xcode-sdk-version",
        message: `Xcode version (${xcodeVersion}) meets App Store requirement.`,
        problemId: "M-13"
      });
    }
  } else {
    findings.push({
      severity: "info",
      rule: "ios-xcode-version-unverified",
      message: "xcodeVersion parameter was not provided; skipping Xcode SDK static check."
    });
  }

  return {
    findings,
    privacyManifestFound,
    attUsedInCode,
    attDescriptionFound
  };
}
