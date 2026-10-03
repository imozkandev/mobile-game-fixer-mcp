import { Finding, makeReport, Report } from "../types.js";
import { scanDirectory } from "./fs.js";
import { checkAndroidCompliance, AndroidComplianceResult } from "./android.js";
import { checkIosCompliance, IosComplianceResult } from "./ios.js";

export interface CheckStoreComplianceOptions {
  projectPath: string;
  platform: "android" | "ios" | "both";
  xcodeVersion?: number;
}

export interface StoreComplianceData {
  platform: "android" | "ios" | "both";
  projectPath: string;
  totalFilesScanned: number;
  sensitiveFilesSkipped: number;
  android?: AndroidComplianceResult;
  ios?: IosComplianceResult;
  notCovered: string[];
}

export function checkStoreCompliance(options: CheckStoreComplianceOptions): Report<StoreComplianceData> {
  const { projectPath, platform, xcodeVersion } = options;

  let scan;
  try {
    scan = scanDirectory(projectPath);
  } catch (err: any) {
    return makeReport("check_store_compliance", [
      {
        severity: "error",
        rule: "io-error",
        message: err.message || "Failed to scan project directory."
      }
    ], `Error reading project path: ${err.message}`);
  }

  const allFindings: Finding[] = [];
  let androidRes: AndroidComplianceResult | undefined;
  let iosRes: IosComplianceResult | undefined;

  // Skipped sensitive files info
  if (scan.sensitiveSkipped > 0) {
    allFindings.push({
      severity: "info",
      rule: "security-sensitive-files-skipped",
      message: `${scan.sensitiveSkipped} sensitive file(s) (.keystore, .p12, .env, google-services.json etc.) were safely skipped from scan.`
    });
  }

  // Partial scan warning
  if (scan.isPartial && scan.partialReason) {
    allFindings.push({
      severity: "warning",
      rule: "scan-partial-limit-reached",
      message: `Partial scan completed: ${scan.partialReason}`
    });
  }

  if (platform === "android" || platform === "both") {
    androidRes = checkAndroidCompliance(scan);
    allFindings.push(...androidRes.findings);
  }

  if (platform === "ios" || platform === "both") {
    iosRes = checkIosCompliance(scan, { xcodeVersion });
    allFindings.push(...iosRes.findings);
  }

  const notCovered = [
    "Runtime dynamic memory and network telemetry",
    "Internal proprietary manifests inside pre-compiled closed-source 3rd party SDKs",
    "Developer account financial profile and merchant verification state",
    "Uncompressed APK/AAB zip file entry alignment (only unzipped source .so ELF headers are analyzed)"
  ];

  return makeReport("check_store_compliance", allFindings, undefined, {
    platform,
    projectPath: scan.rootPath,
    totalFilesScanned: scan.totalScanned,
    sensitiveFilesSkipped: scan.sensitiveSkipped,
    android: androidRes,
    ios: iosRes,
    notCovered
  });
}
