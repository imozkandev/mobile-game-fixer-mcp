import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { KnowledgeBase } from "./knowledge.js";
import { diagnose } from "./core/search.js";
import { upcomingDeadlines } from "./core/deadlines.js";
import { getPrelaunchChecklist, getLaunchRunbook } from "./core/checklist.js";
import { checkStoreCompliance } from "./core/compliance/index.js";
import { makeReport, Report } from "./core/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Initialize Knowledge Base
let kb: KnowledgeBase;
try {
  kb = KnowledgeBase.getInstance(path.join(rootDir, "knowledge"));
} catch (err: any) {
  process.stderr.write(`FATAL: KnowledgeBase failed to load: ${err.message}\n`);
  process.exit(1);
}

// 2. Initialize MCP Server
const server = new McpServer({
  name: "mobile-game-fixer",
  version: "1.0.0"
});

function formatToolResponse<T>(report: Report<T>) {
  return {
    content: [
      {
        type: "text" as const,
        text: `### ${report.tool}\n\n**Status:** ${report.ok ? "✅ SUCCESS" : "⚠️ ISSUES / ACTION REQUIRED"}\n**Summary:** ${report.summary}`
      },
      {
        type: "text" as const,
        text: JSON.stringify(report, null, 2)
      }
    ],
    isError: !report.ok
  };
}

// -------------------------------------------------------------
// TOOLS
// -------------------------------------------------------------

// Tool 1: diagnose_problem
server.registerTool(
  "diagnose_problem",
  {
    description: "Diagnoses mobile game bugs, thermal throttling, crashes, IAP issues, and store rejections from freeform text (TR/EN).",
    inputSchema: {
      symptom: z.string().describe("Description of the symptom, error log, or rejection notice (freeform text)"),
      platform: z.enum(["android", "ios"]).optional().describe("Target platform (android / ios)"),
      engine: z.enum(["unity", "godot", "unreal"]).optional().describe("Game engine (unity / godot / unreal)"),
      limit: z.number().int().positive().optional().describe("Maximum candidate matches to return (default: 3)")
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false
    }
  },
  async ({ symptom, platform, engine, limit }) => {
    const report = diagnose({ symptom, platform, engine, limit });
    return formatToolResponse(report);
  }
);

// Tool 2: get_problem
server.registerTool(
  "get_problem",
  {
    description: "Retrieves the complete verified problem record, root causes, step-by-step action plan, and official sources by ID (e.g. M-01).",
    inputSchema: {
      id: z.string().describe("Problem ID (e.g., M-01, M-10, M-20)")
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false
    }
  },
  async ({ id }) => {
    const cleanId = id.trim().toUpperCase();
    const problem = kb.getProblem(cleanId);
    if (!problem) {
      const report = makeReport("get_problem", [
        {
          severity: "error",
          rule: "problem-not-found",
          message: `Problem record with ID '${id}' not found in knowledge base.`
        }
      ], `Problem '${id}' not found.`);
      return formatToolResponse(report);
    }

    const report = makeReport("get_problem", [
      {
        severity: "info",
        rule: `problem-${problem.id.toLowerCase()}`,
        message: `${problem.id}: ${problem.title} (${problem.category})`,
        problemId: problem.id
      }
    ], `Loaded problem record ${problem.id} - ${problem.title}.`, { problem });

    return formatToolResponse(report);
  }
);

// Tool 3: list_problems
server.registerTool(
  "list_problems",
  {
    description: "Lists all problem records in the knowledge base filtered by category or platform.",
    inputSchema: {
      category: z.string().optional().describe("Category filter (performance, memory, rendering, store_policy, iap, savegame, crash, etc.)"),
      platform: z.enum(["android", "ios"]).optional().describe("Platform filter"),
      confidence: z.enum(["established", "policy", "heuristic"]).optional().describe("Confidence level filter")
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false
    }
  },
  async ({ category, platform, confidence }) => {
    let list = kb.getAllProblems();

    if (category) {
      const normCat = category.toLowerCase();
      list = list.filter((p) => p.category.toLowerCase().includes(normCat));
    }

    if (platform) {
      list = list.filter((p) => p.platforms.includes(platform) || p.platforms.includes("any"));
    }

    if (confidence) {
      list = list.filter((p) => p.confidence === confidence);
    }

    const summaryList = list.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      severity: p.severity,
      confidence: p.confidence,
      platforms: p.platforms
    }));

    const report = makeReport("list_problems", [], `Listed ${summaryList.length} problem records.`, {
      total: summaryList.length,
      problems: summaryList
    });

    return formatToolResponse(report);
  }
);

// Tool 4: upcoming_deadlines
server.registerTool(
  "upcoming_deadlines",
  {
    description: "Evaluates impending Google Play and App Store policy deadlines (Target SDK 35+, 16 KB page-size, Privacy Manifests) against server clock.",
    inputSchema: {
      days: z.number().int().positive().optional().describe("Days ahead to inspect (default: 180)"),
      platform: z.enum(["android", "ios", "both"]).optional().describe("Platform filter")
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false
    }
  },
  async ({ days, platform }) => {
    const report = upcomingDeadlines({ days, platform });
    return formatToolResponse(report);
  }
);

// Tool 5: get_prelaunch_checklist
server.registerTool(
  "get_prelaunch_checklist",
  {
    description: "Returns a filtered pre-launch readiness checklist tailored to platform, monetization (IAP, Ads, Gacha), and child privacy rules.",
    inputSchema: {
      platform: z.enum(["android", "ios", "both"]).describe("Target platform"),
      monetization: z.array(z.enum(["iap", "ads", "gacha"])).optional().describe("Monetization models in use"),
      kids: z.boolean().optional().describe("Whether game targets children (COPPA / Families Policy)"),
      genre: z.string().optional().describe("Game genre")
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false
    }
  },
  async ({ platform, monetization, kids, genre }) => {
    const report = getPrelaunchChecklist({ platform, monetization, kids, genre });
    return formatToolResponse(report);
  }
);

// Tool 6: get_launch_runbook
server.registerTool(
  "get_launch_runbook",
  {
    description: "Retrieves launch-day operational step-by-step runbooks and Go/No-Go decision rules across T-1, Hour-1, Hour-6, and Day-1 phases.",
    inputSchema: {
      phase: z.enum(["t-1", "hour-1", "hour-6", "day-1"]).optional().describe("Specific launch phase")
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false
    }
  },
  async ({ phase }) => {
    const report = getLaunchRunbook({ phase });
    return formatToolResponse(report);
  }
);

// Tool 7: check_store_compliance
server.registerTool(
  "check_store_compliance",
  {
    description: "Statically audits a local project directory for Android & iOS store compliance (Target SDK, 64-bit ELF 16 KB alignment, Privacy Manifests, ATT).",
    inputSchema: {
      projectPath: z.string().describe("Absolute or relative path to local project root directory"),
      platform: z.enum(["android", "ios", "both"]).describe("Platform to audit"),
      xcodeVersion: z.number().optional().describe("Xcode major version used for iOS build (e.g. 16)")
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false
    }
  },
  async ({ projectPath, platform, xcodeVersion }) => {
    const resolvedPath = path.isAbsolute(projectPath) ? projectPath : path.resolve(process.cwd(), projectPath);
    const report = checkStoreCompliance({
      projectPath: resolvedPath,
      platform,
      xcodeVersion
    });
    return formatToolResponse(report);
  }
);

// -------------------------------------------------------------
// RESOURCES
// -------------------------------------------------------------

// Resource 1: mobilegame://problems/{id}
server.registerResource(
  "problem",
  new ResourceTemplate("mobilegame://problems/{id}", { list: undefined }),
  {
    title: "Problem Record",
    description: "Problem case JSON record by ID"
  },
  async (uri, { id }) => {
    const pId = String(id).toUpperCase();
    const problem = kb.getProblem(pId);
    if (!problem) {
      throw new Error(`Problem ${id} not found.`);
    }
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(problem, null, 2),
          mimeType: "application/json"
        }
      ]
    };
  }
);

// Resource 2: mobilegame://rules/{platform}
server.registerResource(
  "rules",
  new ResourceTemplate("mobilegame://rules/{platform}", { list: undefined }),
  {
    title: "Platform Store Rules",
    description: "Verified Android / iOS store policies JSON list"
  },
  async (uri, { platform }) => {
    const p = String(platform).toLowerCase();
    const rules = kb.getAllRules().filter((r) => r.platform === p || r.platform === "both");
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(rules, null, 2),
          mimeType: "application/json"
        }
      ]
    };
  }
);

// Resource 3: mobilegame://guide
server.registerResource(
  "guide",
  "mobilegame://guide",
  {
    title: "Mobile Game Troubleshooting Guide",
    description: "Full text of 44 mobile game problem cases"
  },
  async (uri) => {
    const seedPath = path.join(rootDir, "knowledge-seed", "mobile-game-troubleshooting-guide.md");
    let content = "# Guide not found";
    if (fs.existsSync(seedPath)) {
      content = fs.readFileSync(seedPath, "utf-8");
    }
    return {
      contents: [
        {
          uri: uri.href,
          text: content,
          mimeType: "text/markdown"
        }
      ]
    };
  }
);

// -------------------------------------------------------------
// PROMPTS
// -------------------------------------------------------------

// Prompt 1: incident_triage
server.registerPrompt(
  "incident_triage",
  {
    description: "Step-by-step mobile game troubleshooting and triage workflow",
    argsSchema: {
      symptom: z.string().describe("Observed bug, error log, or store rejection notice"),
      platform: z.string().optional().describe("Target platform (android / ios)")
    }
  },
  async ({ symptom, platform }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I encountered the following issue while developing a mobile game: "${symptom}" (Platform: ${platform || "unspecified"}).

Please follow these triage steps:
1. Call 'diagnose_problem' with the symptom to find the most relevant problem records.
2. Fetch the top-matched record using 'get_problem'.
3. Adapt the resolution steps to the specific project context.
4. If confidence is low or no record exists, never hallucinate store policies or arbitrary fixes; report the uncertainty clearly and proceed with general debugging.`
          }
        }
      ]
    };
  }
);

// Prompt 2: prelaunch_review
server.registerPrompt(
  "prelaunch_review",
  {
    description: "Comprehensive pre-launch store compliance and readiness audit",
    argsSchema: {
      projectPath: z.string().describe("Absolute path to local project root directory"),
      platform: z.string().describe("Target platform (android / ios / both)")
    }
  },
  async ({ projectPath, platform }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `We are preparing for store release and need to audit our project readiness.
Project Path: ${projectPath}
Platform: ${platform}

Please run the following tools sequentially and assemble a unified pre-launch report:
1. 'check_store_compliance' to statically analyze project code and manifests.
2. 'upcoming_deadlines' to identify impending store policy deadlines.
3. 'get_prelaunch_checklist' to retrieve the tailored checklist.
4. Group findings into P0 (Blockers), P1 (Impending Deadlines <= 30 days), and P2 (Quality & Live-Ops).`
          }
        }
      ]
    };
  }
);

// -------------------------------------------------------------
// START SERVER (STDIO)
// -------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`MCP Server run error: ${err.message}\n`);
  process.exit(1);
});
