import { now } from "../clock.js";
import { Finding, makeReport, Report } from "./types.js";
import { KnowledgeBase, Rule } from "../knowledge.js";

export interface UpcomingDeadlinesOptions {
  days?: number;
  platform?: "android" | "ios" | "both";
}

export interface DeadlineItem {
  ruleId: string;
  title: string;
  platform: string;
  effectiveDate: string;
  daysRemaining: number;
  status: "expired" | "due-soon" | "upcoming";
  stale: boolean;
  sourceType: "primary" | "secondary";
  sourceUrl: string;
  problemIds: string[];
}

export interface DeadlinesData {
  expired: DeadlineItem[];
  dueSoon: DeadlineItem[];
  upcoming: DeadlineItem[];
  totalDeadlines: number;
}

export function upcomingDeadlines(options: UpcomingDeadlinesOptions = {}): Report<DeadlinesData> {
  const { days = 180, platform } = options;
  const kb = KnowledgeBase.getInstance();
  const allRules = kb.getAllRules();
  const currentDate = now();
  const currentTimestamp = currentDate.getTime();

  // Filter rules with deadlines
  const deadlineRules = allRules.filter((r) => {
    if (r.kind !== "deadline" || !r.effectiveDate) return false;
    if (platform && platform !== "both") {
      if (r.platform !== platform && r.platform !== "both") return false;
    }
    return true;
  });

  const expired: DeadlineItem[] = [];
  const dueSoon: DeadlineItem[] = [];
  const upcoming: DeadlineItem[] = [];

  for (const rule of deadlineRules) {
    const effectiveDateObj = new Date(rule.effectiveDate!);
    const diffTime = effectiveDateObj.getTime() - currentTimestamp;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Stale check (verifiedAt older than 90 days)
    const verifiedDateObj = new Date(rule.verifiedAt);
    const verifiedDiffDays = Math.floor((currentTimestamp - verifiedDateObj.getTime()) / (1000 * 60 * 60 * 24));
    const stale = verifiedDiffDays > 90;

    const item: DeadlineItem = {
      ruleId: rule.id,
      title: rule.title,
      platform: rule.platform,
      effectiveDate: rule.effectiveDate!,
      daysRemaining: diffDays,
      status: diffDays < 0 ? "expired" : diffDays <= 30 ? "due-soon" : "upcoming",
      stale,
      sourceType: rule.source.type,
      sourceUrl: rule.source.url,
      problemIds: rule.problemIds
    };

    if (diffDays < 0) {
      expired.push(item);
    } else if (diffDays <= 30) {
      dueSoon.push(item);
    } else if (diffDays <= days) {
      upcoming.push(item);
    }
  }

  // Sort groups by effectiveDate ascending
  const sortByDate = (a: DeadlineItem, b: DeadlineItem) => a.effectiveDate.localeCompare(b.effectiveDate);
  expired.sort(sortByDate);
  dueSoon.sort(sortByDate);
  upcoming.sort(sortByDate);

  // Generate findings
  const findings: Finding[] = [];

  for (const item of expired) {
    let msg = `[EXPIRED] ${item.title} (Deadline: ${item.effectiveDate}).`;
    if (item.sourceType === "secondary") {
      msg += " (Secondary source: Verify with developer console)";
    }
    if (item.stale) {
      msg += " [WARNING: Rule verification date older than 90 days]";
    }
    findings.push({
      severity: "error",
      rule: item.ruleId,
      message: msg,
      deadline: item.effectiveDate,
      problemId: item.problemIds[0],
      sourceType: item.sourceType
    });
  }

  for (const item of dueSoon) {
    let msg = `[DUE SOON - ${item.daysRemaining} days left] ${item.title} (Deadline: ${item.effectiveDate}).`;
    if (item.sourceType === "secondary") {
      msg += " (Secondary source: Verify with developer console)";
    }
    if (item.stale) {
      msg += " [WARNING: Rule verification date older than 90 days]";
    }
    findings.push({
      severity: "warning",
      rule: item.ruleId,
      message: msg,
      deadline: item.effectiveDate,
      problemId: item.problemIds[0],
      sourceType: item.sourceType
    });
  }

  for (const item of upcoming) {
    let msg = `[UPCOMING - in ${item.daysRemaining} days] ${item.title} (Deadline: ${item.effectiveDate}).`;
    if (item.sourceType === "secondary") {
      msg += " (Secondary source: Verify with developer console)";
    }
    if (item.stale) {
      msg += " [WARNING: Rule verification date older than 90 days]";
    }
    findings.push({
      severity: "info",
      rule: item.ruleId,
      message: msg,
      deadline: item.effectiveDate,
      problemId: item.problemIds[0],
      sourceType: item.sourceType
    });
  }

  const totalDeadlines = expired.length + dueSoon.length + upcoming.length;
  let summary = `${totalDeadlines} store policy deadline(s) listed: ${expired.length} expired, ${dueSoon.length} due soon (<= 30 days), ${upcoming.length} upcoming.`;

  return makeReport("upcoming_deadlines", findings, summary, {
    expired,
    dueSoon,
    upcoming,
    totalDeadlines
  });
}
