export type Severity = "error" | "warning" | "info";
export type SourceType = "primary" | "secondary";

export interface Finding {
  severity: Severity;
  rule: string;
  message: string;
  fix?: string;
  problemId?: string;
  deadline?: string;
  sourceType?: SourceType;
}

export interface Report<T = Record<string, unknown>> {
  tool: string;
  ok: boolean;
  summary: string;
  findings: Finding[];
  data?: T;
}

export function makeReport<T = Record<string, unknown>>(
  tool: string,
  findings: Finding[] = [],
  summary?: string,
  data?: T
): Report<T> {
  const errorCount = findings.filter((f) => f.severity === "error").length;
  const warningCount = findings.filter((f) => f.severity === "warning").length;
  const infoCount = findings.filter((f) => f.severity === "info").length;
  const ok = errorCount === 0;

  let autoSummary = summary;
  if (!autoSummary) {
    if (findings.length === 0) {
      autoSummary = "Operation completed successfully. No issues or warnings found.";
    } else {
      const parts: string[] = [];
      if (errorCount > 0) parts.push(`${errorCount} error(s)`);
      if (warningCount > 0) parts.push(`${warningCount} warning(s)`);
      if (infoCount > 0) parts.push(`${infoCount} info notice(s)`);
      autoSummary = `Audit completed: ${parts.join(", ")} detected.`;
    }
  }

  return {
    tool,
    ok,
    summary: autoSummary,
    findings,
    data,
  };
}
