import fs from "node:fs";
import path from "node:path";

export interface ScanResult {
  rootPath: string;
  files: string[]; // Relative paths
  sensitiveSkipped: number;
  totalScanned: number;
  isPartial: boolean;
  partialReason?: string;
}

const SENSITIVE_PATTERNS = [
  /\.keystore$/i,
  /\.jks$/i,
  /\.p12$/i,
  /\.mobileprovision$/i,
  /^\.env/i,
  /google-services\.json$/i,
  /GoogleService-Info\.plist$/i
];

const MAX_FILES = 20000;
const MAX_DEPTH = 12;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function isSensitiveFile(fileName: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(fileName));
}

export function scanDirectory(targetPath: string): ScanResult {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Belirtilen proje dizini bulunamadı: ${targetPath}`);
  }

  const rootPath = fs.realpathSync(targetPath);
  const stat = fs.statSync(rootPath);
  if (!stat.isDirectory()) {
    throw new Error(`Belirtilen yol bir dizin değil: ${targetPath}`);
  }

  const collectedFiles: string[] = [];
  let sensitiveSkipped = 0;
  let totalScanned = 0;
  let isPartial = false;
  let partialReason: string | undefined;

  function walk(currentDir: string, depth: number) {
    if (depth > MAX_DEPTH) {
      isPartial = true;
      partialReason = `Maksimum klasör derinliği (${MAX_DEPTH}) aşıldı.`;
      return;
    }

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (totalScanned >= MAX_FILES) {
        isPartial = true;
        partialReason = `Maksimum taranabilir dosya sınırı (${MAX_FILES}) aşıldı.`;
        return;
      }

      const fullPath = path.join(currentDir, entry.name);

      // Check if symlink escapes root
      if (entry.isSymbolicLink()) {
        try {
          const real = fs.realpathSync(fullPath);
          if (!real.startsWith(rootPath)) {
            // Symlink escapes root directory, skip
            continue;
          }
        } catch {
          continue;
        }
      }

      if (entry.isDirectory()) {
        // Skip common heavy / build dirs
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "Pods" || entry.name === "Library") {
          continue;
        }
        walk(fullPath, depth + 1);
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        totalScanned++;
        if (isSensitiveFile(entry.name)) {
          sensitiveSkipped++;
          continue;
        }

        const relPath = path.relative(rootPath, fullPath);
        collectedFiles.push(relPath);
      }
    }
  }

  walk(rootPath, 0);

  return {
    rootPath,
    files: collectedFiles,
    sensitiveSkipped,
    totalScanned,
    isPartial,
    partialReason
  };
}

export function safeReadFile(rootPath: string, relPath: string, maxBytes: number = MAX_FILE_SIZE): Buffer | null {
  const fullPath = path.resolve(rootPath, relPath);
  // Verify path traversal
  const real = fs.realpathSync(fullPath);
  if (!real.startsWith(rootPath)) {
    throw new Error(`Güvenlik uyarısı: Yol kök dizin dışına çıkıyor (${relPath})`);
  }

  const stat = fs.statSync(real);
  if (isSensitiveFile(path.basename(real))) {
    return null;
  }

  const bytesToRead = Math.min(stat.size, maxBytes);
  const fd = fs.openSync(real, "r");
  const buffer = Buffer.alloc(bytesToRead);
  fs.readSync(fd, buffer, 0, bytesToRead, 0);
  fs.closeSync(fd);
  return buffer;
}
