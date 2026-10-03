# Gulliver’s Games Application Pitch: AI Enablement Engineer

**Subject:** AI Enablement Engineer - [Your Name]  
**To:** `takim@gullivers.games`

---

### Application Email Draft

Hi Gulliver’s Games Team,

I’m a builder passionate about making AI agents (Claude Code, Cursor, Codex, MCP) reliably work for game development, live-ops, and studio infrastructure. Rather than relying on fragile prompt engineering, I focus on building deterministic tools, hardened MCP servers, sandboxed skills, and rigorous evaluation suites that prevent agent failures before they reach production.

Here is a project I built demonstrating this exact stack:

**1. Mobile Game Fixer MCP** — [GitHub Repository Link / Project Link]
* **What it is:** A zero-network, deterministic MCP server and AI agent skill designed for mobile game studios (Unity/Godot/Unreal) to diagnose performance issues, audit store compliance (Google Play & App Store), and guide pre-launch live-ops.
* **The Hardest Part:** Parsing 64-bit ELF binary headers directly in-memory to audit Android 15+ 16 KB page-size alignment (`p_align >= 0x4000`) across all native `.so` libraries without shell tools or native dependencies, combined with building a multi-lingual (TR/EN) evaluation harness that achieved **100% Top-1 accuracy across 20 benchmark game triage scenarios with 4.63ms avg latency**.

Looking forward to walking you through how I design agent evals, build studio tooling, and enable teams to ship faster with AI!

Best regards,  
[Your Name]  
[LinkedIn Profile URL]  
[GitHub Profile URL]
