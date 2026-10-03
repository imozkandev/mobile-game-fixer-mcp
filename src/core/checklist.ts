import { KnowledgeBase, ChecklistItem } from "../knowledge.js";
import { Finding, makeReport, Report } from "./types.js";

export interface PrelaunchChecklistOptions {
  platform: "android" | "ios" | "both";
  monetization?: ("iap" | "ads" | "gacha")[];
  kids?: boolean;
  genre?: string;
}

export interface EnrichedChecklistItem extends ChecklistItem {
  problemDetails: { id: string; title: string }[];
}

export interface ChecklistData {
  items: EnrichedChecklistItem[];
  totalItems: number;
  platform: string;
  appliedFilters: {
    monetization?: string[];
    kids?: boolean;
    genre?: string;
  };
}

export function getPrelaunchChecklist(options: PrelaunchChecklistOptions): Report<ChecklistData> {
  const { platform, monetization = [], kids = false, genre } = options;
  const kb = KnowledgeBase.getInstance();
  const allItems = kb.getAllChecklists();

  const filteredItems: EnrichedChecklistItem[] = [];

  for (const item of allItems) {
    // Platform check
    if (platform !== "both") {
      if (!item.platforms.includes(platform as "android" | "ios")) {
        continue;
      }
    }

    // Requirements check
    if (item.requires) {
      // Monetization requirement
      if (item.requires.monetization && item.requires.monetization.length > 0) {
        const hasMatchingMonetization = item.requires.monetization.some((m) => monetization.includes(m));
        if (!hasMatchingMonetization) {
          continue;
        }
      }

      // Kids requirement
      if (item.requires.kids === true && kids !== true) {
        continue;
      }
    }

    // Resolve problem titles
    const problemDetails = item.problemIds.map((pId) => {
      const prob = kb.getProblem(pId);
      return {
        id: pId,
        title: prob ? prob.title : "Unknown Problem"
      };
    });

    filteredItems.push({
      ...item,
      problemDetails
    });
  }

  const findings: Finding[] = filteredItems.map((item) => {
    const pInfo = item.problemDetails.map((p) => `${p.id} (${p.title})`).join(", ");
    return {
      severity: "info",
      rule: item.id,
      message: `[${item.area}] ${item.text} -> Related: ${pInfo}`,
      problemId: item.problemIds[0]
    };
  });

  const summary = `${filteredItems.length} checklist item(s) retrieved for platform: ${platform}.`;

  return makeReport("get_prelaunch_checklist", findings, summary, {
    items: filteredItems,
    totalItems: filteredItems.length,
    platform,
    appliedFilters: {
      monetization,
      kids,
      genre
    }
  });
}

export interface RunbookOptions {
  phase?: "t-1" | "hour-1" | "hour-6" | "day-1";
}

export interface RunbookData {
  phases: Record<string, { title: string; steps: string[]; decisionRules: string[] }>;
  selectedPhase?: string;
}

export function getLaunchRunbook(options: RunbookOptions = {}): Report<RunbookData> {
  const { phase } = options;
  const kb = KnowledgeBase.getInstance();
  const rawRunbook = kb.getRunbook();

  if (!rawRunbook) {
    return makeReport("get_launch_runbook", [
      {
        severity: "error",
        rule: "runbook-missing",
        message: "Launch runbook (launch-day.json) not found in knowledge base."
      }
    ], "Failed to load launch runbook.");
  }

  if (phase && !rawRunbook.phases[phase]) {
    const validPhases = Object.keys(rawRunbook.phases).join(", ");
    return makeReport("get_launch_runbook", [
      {
        severity: "error",
        rule: "invalid-phase",
        message: `Invalid launch phase: '${phase}'. Valid options: ${validPhases}`
      }
    ], `Invalid launch phase: '${phase}'.`);
  }

  const phasesToReturn: Record<string, { title: string; steps: string[]; decisionRules: string[] }> = {};

  if (phase) {
    phasesToReturn[phase] = rawRunbook.phases[phase];
  } else {
    Object.assign(phasesToReturn, rawRunbook.phases);
  }

  const findings: Finding[] = [];
  for (const [pKey, pVal] of Object.entries(phasesToReturn)) {
    findings.push({
      severity: "info",
      rule: `phase-${pKey}`,
      message: `${pVal.title}: ${pVal.steps.length} steps, ${pVal.decisionRules.length} decision rules.`
    });
  }

  const summary = phase
    ? `Launch runbook phase '${phasesToReturn[phase].title}' loaded.`
    : `Launch runbook (4 phases) loaded.`;

  return makeReport("get_launch_runbook", findings, summary, {
    phases: phasesToReturn,
    selectedPhase: phase
  });
}
