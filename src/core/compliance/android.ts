import { Finding } from "../types.js";
import { KnowledgeBase } from "../../knowledge.js";
import { safeReadFile, ScanResult } from "./fs.js";

export interface AndroidComplianceResult {
  findings: Finding[];
  targetSdk?: number;
  minSdk?: number;
  soFilesChecked: number;
}

export function checkAndroidCompliance(scan: ScanResult): AndroidComplianceResult {
  const findings: Finding[] = [];
  const kb = KnowledgeBase.getInstance();
  const rules = kb.getAllRules();
  const targetApiRule = rules.find((r) => r.id === "play-target-api");
  const elfRule = rules.find((r) => r.id === "play-16kb-page-size");

  let detectedTargetSdk: number | undefined;
  let detectedMinSdk: number | undefined;

  // 1. Check build.gradle / build.gradle.kts / gradle.properties / Unity ProjectSettings.asset
  const gradleFiles = scan.files.filter((f) =>
    f.endsWith("build.gradle") ||
    f.endsWith("build.gradle.kts") ||
    f.endsWith("ProjectSettings.asset")
  );

  for (const gFile of gradleFiles) {
    const buf = safeReadFile(scan.rootPath, gFile);
    if (!buf) continue;
    const content = buf.toString("utf-8");

    // targetSdk / targetSdkVersion regex
    const targetMatch = content.match(/targetSdk(?:Version)?\s*=?\s*(\d+)/i) ||
      content.match(/AndroidTargetSdkVersion:\s*(\d+)/i);
    if (targetMatch) {
      const val = parseInt(targetMatch[1], 10);
      if (gFile.includes("ProjectSettings.asset") && val === 0) {
        findings.push({
          severity: "info",
          rule: "unity-target-sdk-auto",
          message: `${gFile}: AndroidTargetSdkVersion is set to 0 (Automatic). Ensure compiled build targets at least API 35+.`,
          problemId: "M-10"
        });
      } else if (val > 0) {
        detectedTargetSdk = val;
      }
    }

    // minSdk regex
    const minMatch = content.match(/minSdk(?:Version)?\s*=?\s*(\d+)/i) ||
      content.match(/AndroidMinSdkVersion:\s*(\d+)/i);
    if (minMatch) {
      detectedMinSdk = parseInt(minMatch[1], 10);
    }
  }

  // Validate Target SDK against store rule
  const REQUIRED_TARGET_SDK = 35;
  if (detectedTargetSdk !== undefined) {
    if (detectedTargetSdk < REQUIRED_TARGET_SDK) {
      findings.push({
        severity: "error",
        rule: targetApiRule?.id || "play-target-api",
        message: `Current targetSdkVersion is ${detectedTargetSdk}. Google Play requires at least API ${REQUIRED_TARGET_SDK}+ for release submissions.`,
        fix: `Update targetSdkVersion to ${REQUIRED_TARGET_SDK} or higher in build.gradle or Project Settings.`,
        problemId: "M-10",
        deadline: targetApiRule?.effectiveDate,
        sourceType: targetApiRule?.source.type
      });
    } else {
      findings.push({
        severity: "info",
        rule: "play-target-api",
        message: `targetSdkVersion (${detectedTargetSdk}) satisfies Google Play requirement (>= ${REQUIRED_TARGET_SDK}).`,
        problemId: "M-10"
      });
    }
  } else if (gradleFiles.length > 0) {
    findings.push({
      severity: "warning",
      rule: "play-target-api-undetected",
      message: "No explicit targetSdkVersion definition detected in gradle/project files.",
      fix: "Verify in build settings that targetSdkVersion is set to at least API 35.",
      problemId: "M-10"
    });
  }

  // 2. Check AndroidManifest.xml
  const manifestFiles = scan.files.filter((f) => f.endsWith("AndroidManifest.xml"));
  for (const mFile of manifestFiles) {
    const buf = safeReadFile(scan.rootPath, mFile);
    if (!buf) continue;
    const xml = buf.toString("utf-8");

    // Exported check on components with intent-filter
    const componentRegex = /<(activity|service|receiver|provider)[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    while ((match = componentRegex.exec(xml)) !== null) {
      const fullTag = match[0];
      const inner = match[2];
      const hasIntentFilter = /<intent-filter[\s>]/i.test(inner);
      const hasExported = /android:exported\s*=\s*["'](true|false)["']/i.test(fullTag);

      if (hasIntentFilter && !hasExported) {
        findings.push({
          severity: "error",
          rule: "android-manifest-exported-missing",
          message: `${mFile}: Component containing <intent-filter> is missing explicit 'android:exported' attribute.`,
          fix: "Add android:exported=\"true\" or \"false\" for Android 12+ (API 31+) compliance.",
          problemId: "M-10"
        });
      }
    }

    // allowBackup check
    if (/android:allowBackup\s*=\s*["']true["']/i.test(xml) && !/android:fullBackupContent/i.test(xml)) {
      findings.push({
        severity: "warning",
        rule: "android-allow-backup-unfiltered",
        message: `${mFile}: android:allowBackup=\"true\" is enabled without custom backup rules.`,
        fix: "Set allowBackup=\"false\" or declare @xml/backup_rules to prevent inadvertent sensitive savegame extraction.",
        problemId: "M-25"
      });
    }

    // List permissions
    const permMatches = xml.match(/<uses-permission[^>]*android:name=["']([^"']+)["']/gi);
    if (permMatches && permMatches.length > 0) {
      const perms = permMatches.map((p) => {
        const m = p.match(/android:name=["']([^"']+)["']/i);
        return m ? m[1] : p;
      });
      findings.push({
        severity: "info",
        rule: "android-permissions-list",
        message: `${mFile}: Declares ${perms.length} permission(s): ${perms.slice(0, 5).join(", ")}${perms.length > 5 ? "..." : ""}.`
      });
    }
  }

  // 3. Check ELF .so files for 16 KB page alignment
  const soFiles = scan.files.filter((f) => f.endsWith(".so"));
  let soChecked = 0;

  for (const soFile of soFiles) {
    const buf = safeReadFile(scan.rootPath, soFile, 65536);
    if (!buf || buf.length < 52) continue;

    // Verify ELF Magic
    if (buf[0] !== 0x7f || buf[1] !== 0x45 || buf[2] !== 0x4c || buf[3] !== 0x46) {
      continue;
    }

    const eiClass = buf[4]; // 1 = 32-bit, 2 = 64-bit
    const eiData = buf[5]; // 1 = Little Endian, 2 = Big Endian
    const isLittleEndian = eiData === 1;

    if (eiClass === 1) {
      findings.push({
        severity: "info",
        rule: "android-elf-32bit-skipped",
        message: `${soFile}: 32-bit ELF binary (16 KB alignment checks apply strictly to 64-bit arm64-v8a/x86_64 binaries).`,
        problemId: "M-11"
      });
      continue;
    }

    if (eiClass === 2) {
      soChecked++;
      const readUint16 = (offset: number) => isLittleEndian ? buf.readUInt16LE(offset) : buf.readUInt16BE(offset);
      const readUint32 = (offset: number) => isLittleEndian ? buf.readUInt32LE(offset) : buf.readUInt32BE(offset);
      const readBigUInt64 = (offset: number) => isLittleEndian ? buf.readBigUInt64LE(offset) : buf.readBigUInt64BE(offset);

      const e_phoff = Number(readBigUInt64(32));
      const e_phentsize = readUint16(54);
      const e_phnum = readUint16(56);

      let is16KbAligned = true;
      let minAlign = BigInt(0);

      if (e_phoff > 0 && e_phentsize >= 56 && buf.length >= e_phoff + e_phnum * e_phentsize) {
        for (let i = 0; i < e_phnum; i++) {
          const phOffset = e_phoff + i * e_phentsize;
          const p_type = readUint32(phOffset);
          if (p_type === 1) {
            const p_align = readBigUInt64(phOffset + 48);
            if (minAlign === BigInt(0) || p_align < minAlign) {
              minAlign = p_align;
            }
            if (p_align < BigInt(16384)) {
              is16KbAligned = false;
            }
          }
        }
      }

      if (!is16KbAligned) {
        findings.push({
          severity: "error",
          rule: elfRule?.id || "android-elf-16kb-alignment",
          message: `${soFile}: PT_LOAD p_align is 0x${minAlign.toString(16)} (16 KB page-size requires at least 0x4000).`,
          fix: "Recompile with NDK r28+ using '-Wl,-z,max-page-size=16384' or request 16 KB compliant binaries from SDK vendor.",
          problemId: "M-11",
          deadline: elfRule?.effectiveDate,
          sourceType: elfRule?.source.type
        });
      } else {
        findings.push({
          severity: "info",
          rule: "android-elf-16kb-alignment",
          message: `${soFile}: 16 KB page-size alignment verified (p_align >= 0x4000).`,
          problemId: "M-11"
        });
      }
    }
  }

  return {
    findings,
    targetSdk: detectedTargetSdk,
    minSdk: detectedMinSdk,
    soFilesChecked: soChecked
  };
}
