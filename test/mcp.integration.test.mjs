import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const serverScript = path.resolve(process.cwd(), "dist", "mcp.js");

test("MCP Server stdio integration test", async () => {
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverScript]
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);

  // 1. listTools
  const toolsRes = await client.listTools();
  const toolNames = toolsRes.tools.map((t) => t.name);

  const expectedTools = [
    "diagnose_problem",
    "get_problem",
    "list_problems",
    "upcoming_deadlines",
    "get_prelaunch_checklist",
    "get_launch_runbook",
    "check_store_compliance"
  ];

  for (const exp of expectedTools) {
    assert.ok(toolNames.includes(exp), `Expected tool ${exp} in tools list`);
  }

  // 2. callTool: diagnose_problem
  const diagRes = await client.callTool({
    name: "diagnose_problem",
    arguments: {
      symptom: "oyun ısınıyor ve fps düşüyor"
    }
  });

  assert.equal(diagRes.isError, false);
  assert.ok(Array.isArray(diagRes.content));
  const textContent = diagRes.content.map((c) => c.text).join("\n");
  assert.ok(textContent.includes("M-01"));

  // 3. callTool: get_problem with non-existent ID -> isError: true
  const notFoundRes = await client.callTool({
    name: "get_problem",
    arguments: {
      id: "M-99"
    }
  });

  assert.equal(notFoundRes.isError, true, "Expected isError: true for non-existent problem ID");

  // 4. readResource
  const resRead = await client.readResource({
    uri: "mobilegame://problems/M-01"
  });

  assert.ok(resRead.contents.length > 0);
  assert.ok(resRead.contents[0].text.includes("M-01"));

  // 5. listPrompts & getPrompt
  const promptsRes = await client.listPrompts();
  const promptNames = promptsRes.prompts.map((p) => p.name);
  assert.ok(promptNames.includes("incident_triage"));
  assert.ok(promptNames.includes("prelaunch_review"));

  const promptContent = await client.getPrompt({
    name: "incident_triage",
    arguments: {
      symptom: "Donma sorunu"
    }
  });

  assert.ok(promptContent.messages.length > 0);
  assert.ok(promptContent.messages[0].content.text.includes("Donma sorunu"));

  await client.close();
});
