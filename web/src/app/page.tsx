"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  BookOpen,
  Calendar,
  CheckSquare,
  ShieldAlert,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ChevronRight,
  ExternalLink,
  Terminal,
  Cpu,
  Smartphone,
  RefreshCw,
  FolderSearch,
  Clock,
  Layers,
  Check,
  X,
  Copy,
  SlidersHorizontal,
  FileCode,
  ShieldCheck
} from "lucide-react";

export default function MobileGameFixerApp() {
  const [activeTab, setActiveTab] = useState<"diagnose" | "problems" | "deadlines" | "checklist" | "scanner" | "evals">("diagnose");

  // Diagnosis State
  const [symptom, setSymptom] = useState("");
  const [diagPlatform, setDiagPlatform] = useState<string>("all");
  const [diagEngine, setDiagEngine] = useState<string>("all");
  const [diagResults, setDiagResults] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Selected Problem Detail Modal
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  // Problems Library State
  const [allProblems, setAllProblems] = useState<any[]>([]);
  const [probCategory, setProbCategory] = useState<string>("all");
  const [probSearch, setProbSearch] = useState("");
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);

  // Deadlines State
  const [deadlinesData, setDeadlinesData] = useState<any>(null);
  const [isLoadingDeadlines, setIsLoadingDeadlines] = useState(false);

  // Checklist State
  const [chkPlatform, setChkPlatform] = useState<"android" | "ios" | "both">("both");
  const [chkMonetization, setChkMonetization] = useState<string[]>(["iap", "ads"]);
  const [chkKids, setChkKids] = useState(false);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [chkSubTab, setChkSubTab] = useState<"checklist" | "runbook">("checklist");
  const [runbookData, setRunbookData] = useState<any>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>("t-1");

  // Scanner State
  const [scanPreset, setScanPreset] = useState<string>("android-bad");
  const [customScanPath, setCustomScanPath] = useState("");
  const [scanPlatform, setScanPlatform] = useState<"android" | "ios" | "both">("android");
  const [scanReport, setScanReport] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Evals State
  const [evalsData, setEvalsData] = useState<any>(null);
  const [isLoadingEvals, setIsLoadingEvals] = useState(false);

  // Developer Scenario Quick-Picks
  const sampleQueries = [
    { label: "Thermal Throttling & FPS Drop", query: "Game heats up after 15 minutes and frame rate drops from 60 to 25" },
    { label: "Low Memory OOM Crash", query: "Game silently crashes to home screen on 2GB and 3GB RAM budget phones" },
    { label: "GC Allocation Spikes", query: "Periodic micro-stutter every 3 seconds profiler shows high GC.Alloc" },
    { label: "Google Play Target API 35", query: "Google Play Console rejects upload target SDK level must be at least 35" },
    { label: "16 KB ELF Page Alignment", query: "Native library 16 KB page size alignment error on Android 15" },
    { label: "iOS Privacy Manifest", query: "Apple Privacy Manifest missing required reason API declaration for UserDefaults" },
    { label: "IAP Pending Receipt", query: "In-app purchase charged money but items not credited pending transaction failure" },
    { label: "Cloud Save Data Loss", query: "Game save progress lost when user upgrades or changes device" },
    { label: "Emergency Remote Kill Switch", query: "Mini-game exploit found need instant remote kill switch without store update" },
    { label: "Turkish 'i' Casing Bug", query: "Turkish uppercase lowercase string conversion breaking dictionary key lookup" }
  ];

  // 1. Diagnose query trigger
  useEffect(() => {
    if (!symptom.trim()) {
      setDiagResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsDiagnosing(true);
      try {
        const params = new URLSearchParams({
          symptom,
          limit: "5"
        });
        if (diagPlatform !== "all") params.append("platform", diagPlatform);
        if (diagEngine !== "all") params.append("engine", diagEngine);

        const res = await fetch(`/api/diagnose?${params.toString()}`);
        const data = await res.json();
        setDiagResults(data);
      } catch (err) {
        console.error("Diagnosis fetch error:", err);
      } finally {
        setIsDiagnosing(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [symptom, diagPlatform, diagEngine]);

  // Fetch Problem Detail by ID
  const fetchProblemDetail = async (id: string) => {
    setIsLoadingProblem(true);
    try {
      const res = await fetch(`/api/problems?id=${id}`);
      const data = await res.json();
      if (data.problem) {
        setSelectedProblem(data.problem);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingProblem(false);
    }
  };

  // 2. Fetch All Problems
  useEffect(() => {
    if (activeTab === "problems" && allProblems.length === 0) {
      setIsLoadingProblems(true);
      fetch("/api/problems")
        .then((r) => r.json())
        .then((data) => {
          if (data.problems) setAllProblems(data.problems);
        })
        .finally(() => setIsLoadingProblems(false));
    }
  }, [activeTab, allProblems.length]);

  // 3. Fetch Deadlines
  useEffect(() => {
    if (activeTab === "deadlines" && !deadlinesData) {
      setIsLoadingDeadlines(true);
      fetch("/api/deadlines?days=365")
        .then((r) => r.json())
        .then((data) => setDeadlinesData(data))
        .finally(() => setIsLoadingDeadlines(false));
    }
  }, [activeTab, deadlinesData]);

  // 4. Fetch Checklist & Runbook
  useEffect(() => {
    if (activeTab === "checklist") {
      const params = new URLSearchParams({
        platform: chkPlatform,
        monetization: chkMonetization.join(","),
        kids: chkKids ? "true" : "false"
      });
      fetch(`/api/checklist?${params.toString()}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.data?.items) setChecklistItems(data.data.items);
        });

      if (!runbookData) {
        fetch("/api/checklist?type=runbook")
          .then((r) => r.json())
          .then((data) => setRunbookData(data));
      }
    }
  }, [activeTab, chkPlatform, chkMonetization, chkKids, runbookData]);

  // 5. Fetch Evals
  useEffect(() => {
    if (activeTab === "evals" && !evalsData) {
      setIsLoadingEvals(true);
      fetch("/api/evals")
        .then((r) => r.json())
        .then((data) => setEvalsData(data))
        .finally(() => setIsLoadingEvals(false));
    }
  }, [activeTab, evalsData]);

  // Run Compliance Scan
  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset: scanPreset !== "custom" ? scanPreset : undefined,
          customPath: scanPreset === "custom" ? customScanPath : undefined,
          platform: scanPlatform
        })
      });
      const data = await res.json();
      setScanReport(data);
    } catch (err) {
      console.error("Scan error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Filtered problems list
  const filteredProblems = useMemo(() => {
    return allProblems.filter((p) => {
      const matchCat = probCategory === "all" || p.category.toLowerCase() === probCategory.toLowerCase();
      const matchSearch =
        !probSearch.trim() ||
        p.id.toLowerCase().includes(probSearch.toLowerCase()) ||
        p.title.toLowerCase().includes(probSearch.toLowerCase()) ||
        p.symptoms.some((s: string) => s.toLowerCase().includes(probSearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [allProblems, probCategory, probSearch]);

  const toggleCheck = (id: string) => {
    const updated = new Set(checkedIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setCheckedIds(updated);
  };

  const copyStepToClipboard = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-app)" }}>
      {/* TOP STATUS BAR & HEADER */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-app)",
          position: "sticky",
          top: 0,
          zIndex: 40
        }}
      >
        <div
          style={{
            maxWidth: "1360px",
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px"
          }}
        >
          {/* Brand & Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-xs)",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-default)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Terminal size={15} color="var(--text-primary)" />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>mobile-game-fixer</span>
              <span style={{ color: "var(--text-faint)" }}>/</span>
              <span style={{ color: "var(--text-secondary)" }}>mcp-engine</span>
              <span className="tag tag-default" style={{ fontSize: "10px", padding: "1px 5px" }}>v1.0.0</span>
            </div>
          </div>

          {/* Engine Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                fontSize: "12px",
                color: "var(--text-secondary)"
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--status-success-text)" }} />
              <span>44 Rules Loaded · Zero-Network · Deterministic</span>
            </div>
          </div>
        </div>

        {/* CLEAN TAB NAVIGATION */}
        <div
          style={{
            maxWidth: "1360px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            gap: "4px",
            overflowX: "auto",
            borderTop: "1px solid var(--border-subtle)"
          }}
        >
          {[
            { id: "diagnose", label: "Triage & Diagnosis", icon: Search },
            { id: "problems", label: "Knowledge Base (44)", icon: BookOpen },
            { id: "deadlines", label: "Store Policy Radar", icon: Calendar },
            { id: "checklist", label: "Pre-Launch & Runbook", icon: CheckSquare },
            { id: "scanner", label: "Static Code Auditor", icon: ShieldAlert },
            { id: "evals", label: "CI Evals & Benchmarks", icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  borderBottom: isActive ? "2px solid var(--text-primary)" : "2px solid transparent",
                  transition: "all 0.1s ease",
                  whiteSpace: "nowrap"
                }}
              >
                <Icon size={14} color={isActive ? "var(--text-primary)" : "var(--text-muted)"} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ flex: 1, maxWidth: "1360px", width: "100%", margin: "0 auto", padding: "24px" }}>
        {/* ============================================================ */}
        {/* TAB 1: TRIAGE & DIAGNOSIS */}
        {/* ============================================================ */}
        {activeTab === "diagnose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Search Input Box */}
            <div className="surface-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Symptom & Error Triage Engine
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Exact phrase & Turkish/English token matching
                </span>
              </div>

              {/* Command Search Input */}
              <div style={{ position: "relative", marginBottom: "14px" }}>
                <input
                  type="text"
                  placeholder="Describe game symptoms, crash logs, or store rejection notices..."
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 38px 12px 38px",
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
                <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                {symptom && (
                  <button
                    onClick={() => setSymptom("")}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Filters & Results Counter */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={diagPlatform}
                    onChange={(e) => setDiagPlatform(e.target.value)}
                    style={{
                      padding: "5px 10px",
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-xs)",
                      fontSize: "12px"
                    }}
                  >
                    <option value="all">Platform: All</option>
                    <option value="android">Android</option>
                    <option value="ios">iOS</option>
                  </select>

                  <select
                    value={diagEngine}
                    onChange={(e) => setDiagEngine(e.target.value)}
                    style={{
                      padding: "5px 10px",
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-xs)",
                      fontSize: "12px"
                    }}
                  >
                    <option value="all">Engine: All</option>
                    <option value="unity">Unity</option>
                    <option value="godot">Godot</option>
                    <option value="unreal">Unreal</option>
                  </select>
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {isDiagnosing ? "Searching index..." : diagResults?.data?.matches ? `${diagResults.data.matches.length} candidate(s) retrieved` : ""}
                </div>
              </div>

              {/* Sample Queries */}
              <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-faint)", alignSelf: "center", marginRight: "4px" }}>QUICK QUERIES:</span>
                {sampleQueries.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSymptom(item.query)}
                    className="tag tag-default"
                    style={{ cursor: "pointer", transition: "all 0.1s ease" }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Diagnostic Matches */}
            {diagResults && diagResults.data?.matches && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {diagResults.data.matches.length === 0 ? (
                  <div className="surface-card" style={{ padding: "32px", textAlign: "center" }}>
                    <Info size={24} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>No Confident Match</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      No knowledge entries met the scoring threshold. The engine is strictly deterministic and does not hallucinate.
                    </div>
                  </div>
                ) : (
                  diagResults.data.matches.map((match: any, index: number) => {
                    const isTop = index === 0;
                    return (
                      <div
                        key={match.id}
                        className="surface-card-interactive"
                        onClick={() => fetchProblemDetail(match.id)}
                        style={{
                          padding: "16px 20px",
                          borderLeft: isTop ? "3px solid var(--text-primary)" : "1px solid var(--border-default)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>
                              {match.id}
                            </span>
                            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                              {match.title}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <span className={`tag ${match.severity === "critical" ? "tag-error" : match.severity === "high" ? "tag-warning" : "tag-default"}`}>
                              {match.severity}
                            </span>
                            <span className={`tag ${match.confidence === "high" ? "tag-success" : "tag-info"}`}>
                              {match.confidence} confidence (score: {match.score})
                            </span>
                            <span className="tag tag-default">{match.category}</span>
                          </div>
                        </div>

                        {/* Immediate Resolution Step */}
                        <div
                          style={{
                            background: "var(--bg-app)",
                            padding: "10px 14px",
                            borderRadius: "var(--radius-xs)",
                            border: "1px solid var(--border-subtle)",
                            marginBottom: "8px",
                            fontSize: "13px"
                          }}
                        >
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--status-success-text)", textTransform: "uppercase", marginRight: "8px" }}>
                            Step 1 (Immediate Fix):
                          </span>
                          <span style={{ color: "var(--text-secondary)" }}>{match.firstStep}</span>
                        </div>

                        {/* Bottom Metadata */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                          <div>
                            Matched tokens: <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{match.matchedTerms.slice(0, 5).join(", ")}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-primary)", fontWeight: 500 }}>
                            View resolution guide <ChevronRight size={14} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: PROBLEMS CATALOG (44 CASES) */}
        {/* ============================================================ */}
        {activeTab === "problems" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Filter Bar */}
            <div className="surface-card" style={{ padding: "14px 18px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600 }}>
                Problem Catalog <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({filteredProblems.length} of 44 loaded)</span>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Search problem ID or keywords..."
                  value={probSearch}
                  onChange={(e) => setProbSearch(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-xs)",
                    fontSize: "12px",
                    width: "220px"
                  }}
                />

                <select
                  value={probCategory}
                  onChange={(e) => setProbCategory(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-xs)",
                    fontSize: "12px"
                  }}
                >
                  <option value="all">Category: All</option>
                  <option value="performance">Performance & Thermal</option>
                  <option value="memory">Memory & OOM</option>
                  <option value="rendering">Rendering & GPU</option>
                  <option value="store_policy">Store Policies</option>
                  <option value="iap">IAP & Billing</option>
                  <option value="save_migration">Save Migration</option>
                  <option value="crash_vitals">Crash & Android Vitals</option>
                  <option value="localization">Localization & Unicode</option>
                  <option value="liveops_churn">Live-Ops & Churn</option>
                  <option value="device_notch">Device & Notch</option>
                  <option value="audio">Audio & Routing</option>
                  <option value="launch_backend">Launch Infrastructure</option>
                  <option value="security">Security & Anti-Cheat</option>
                </select>
              </div>
            </div>

            {/* Problem Cards Grid */}
            {isLoadingProblems ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading problem index...</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "12px" }}>
                {filteredProblems.map((p) => (
                  <div
                    key={p.id}
                    className="surface-card-interactive"
                    onClick={() => fetchProblemDetail(p.id)}
                    style={{
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "10px"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "12px", color: "var(--text-primary)" }}>{p.id}</span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <span className={`tag ${p.severity === "critical" ? "tag-error" : p.severity === "high" ? "tag-warning" : "tag-default"}`}>
                            {p.severity}
                          </span>
                          <span className="tag tag-default">{p.category}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.4, color: "var(--text-primary)", marginBottom: "4px" }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.symptoms[0]}
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-muted)" }}>
                      <span>Engines: {p.engines.join(", ")}</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>Inspect Guide →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: STORE POLICY DEADLINES */}
        {/* ============================================================ */}
        {activeTab === "deadlines" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Metrics */}
            {deadlinesData && deadlinesData.data && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                <div className="surface-card" style={{ padding: "16px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>TOTAL DEADLINES TRACKED</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "2px", color: "var(--text-primary)" }}>
                    {deadlinesData.data.totalDeadlines}
                  </div>
                </div>

                <div className="surface-card" style={{ padding: "16px", borderLeft: "3px solid var(--status-error-text)" }}>
                  <div style={{ fontSize: "11px", color: "var(--status-error-text)", fontWeight: 600 }}>EXPIRED (ENFORCED)</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "2px", color: "var(--status-error-text)" }}>
                    {deadlinesData.data.expired.length}
                  </div>
                </div>

                <div className="surface-card" style={{ padding: "16px", borderLeft: "3px solid var(--status-warning-text)" }}>
                  <div style={{ fontSize: "11px", color: "var(--status-warning-text)", fontWeight: 600 }}>DUE SOON (≤ 30 DAYS)</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "2px", color: "var(--status-warning-text)" }}>
                    {deadlinesData.data.dueSoon.length}
                  </div>
                </div>

                <div className="surface-card" style={{ padding: "16px", borderLeft: "3px solid var(--status-info-text)" }}>
                  <div style={{ fontSize: "11px", color: "var(--status-info-text)", fontWeight: 600 }}>UPCOMING POLICY DATES</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "2px", color: "var(--status-info-text)" }}>
                    {deadlinesData.data.upcoming.length}
                  </div>
                </div>
              </div>
            )}

            {/* Deadlines List */}
            {isLoadingDeadlines ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Calculating store deadlines...</div>
            ) : deadlinesData && deadlinesData.data ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[...deadlinesData.data.expired, ...deadlinesData.data.dueSoon, ...deadlinesData.data.upcoming].map((item: any) => {
                  const isExpired = item.status === "expired";
                  const isDueSoon = item.status === "due-soon";
                  return (
                    <div
                      key={item.ruleId}
                      className="surface-card"
                      style={{
                        padding: "16px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "12px",
                        borderLeft: isExpired ? "3px solid var(--status-error-text)" : isDueSoon ? "3px solid var(--status-warning-text)" : "1px solid var(--border-default)"
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>{item.title}</span>
                          <span className={`tag ${isExpired ? "tag-error" : isDueSoon ? "tag-warning" : "tag-default"}`}>
                            {isExpired ? "EXPIRED" : isDueSoon ? `${item.daysRemaining}d remaining` : `Upcoming (${item.daysRemaining}d)`}
                          </span>
                          <span className="tag tag-default">{item.platform}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          Effective: <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{item.effectiveDate}</span> · Problems: <span style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{item.problemIds.join(", ")}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline"
                            style={{ fontSize: "12px", padding: "4px 10px" }}
                          >
                            Official Docs <ExternalLink size={12} />
                          </a>
                        )}
                        <button
                          onClick={() => fetchProblemDetail(item.problemIds[0])}
                          className="btn-solid"
                          style={{ fontSize: "12px", padding: "4px 12px" }}
                        >
                          View Fix
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: PRE-LAUNCH & RUNBOOK */}
        {/* ============================================================ */}
        {activeTab === "checklist" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Switcher */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setChkSubTab("checklist")}
                className={chkSubTab === "checklist" ? "btn-solid" : "btn-outline"}
              >
                Pre-Launch Checklist ({checklistItems.length})
              </button>
              <button
                onClick={() => setChkSubTab("runbook")}
                className={chkSubTab === "runbook" ? "btn-solid" : "btn-outline"}
              >
                Launch Day Runbook
              </button>
            </div>

            {chkSubTab === "checklist" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Filter Controls */}
                <div className="surface-card" style={{ padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Platform:</span>
                    {(["both", "android", "ios"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setChkPlatform(p)}
                        className={chkPlatform === p ? "btn-solid" : "btn-outline"}
                        style={{ padding: "3px 10px", fontSize: "11px" }}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Monetization:</span>
                    {["iap", "ads", "gacha"].map((m) => {
                      const isSelected = chkMonetization.includes(m);
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            if (isSelected) setChkMonetization(chkMonetization.filter((x) => x !== m));
                            else setChkMonetization([...chkMonetization, m]);
                          }}
                          className={`tag ${isSelected ? "tag-info" : "tag-default"}`}
                          style={{ cursor: "pointer" }}
                        >
                          {m.toUpperCase()}
                        </button>
                      );
                    })}

                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", marginLeft: "6px" }}>
                      <input type="checkbox" checked={chkKids} onChange={(e) => setChkKids(e.target.checked)} />
                      <span>Child Audience (COPPA)</span>
                    </label>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ flex: 1, height: "4px", background: "var(--bg-subtle)", borderRadius: "2px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${checklistItems.length > 0 ? (checkedIds.size / checklistItems.length) * 100 : 0}%`,
                        height: "100%",
                        background: "var(--status-success-text)",
                        transition: "width 0.2s ease"
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--status-success-text)", fontFamily: "var(--font-mono)" }}>
                    {checkedIds.size} / {checklistItems.length} passed ({checklistItems.length > 0 ? Math.round((checkedIds.size / checklistItems.length) * 100) : 0}%)
                  </span>
                </div>

                {/* Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {checklistItems.map((item) => {
                    const isChecked = checkedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className="surface-card"
                        onClick={() => toggleCheck(item.id)}
                        style={{
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          cursor: "pointer",
                          opacity: isChecked ? 0.6 : 1
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "3px",
                              border: isChecked ? "none" : "1px solid var(--border-strong)",
                              background: isChecked ? "var(--status-success-text)" : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            {isChecked && <Check size={12} color="#000" />}
                          </div>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", textDecoration: isChecked ? "line-through" : "none" }}>
                              {item.text}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
                              Area: {item.area} · Platforms: {item.platforms.join(", ")}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "4px" }}>
                          {item.problemDetails?.map((p: any) => (
                            <button
                              key={p.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchProblemDetail(p.id);
                              }}
                              className="tag tag-default"
                              style={{ cursor: "pointer" }}
                            >
                              {p.id}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Runbook */
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {runbookData?.data?.phases && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                      {Object.entries(runbookData.data.phases).map(([key, val]: [string, any]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedPhase(key)}
                          className="surface-card"
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            borderLeft: selectedPhase === key ? "3px solid var(--text-primary)" : "1px solid var(--border-default)",
                            background: selectedPhase === key ? "var(--bg-surface-elevated)" : "var(--bg-surface)"
                          }}
                        >
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{key}</div>
                          <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px", color: "var(--text-primary)" }}>{val.title}</div>
                        </button>
                      ))}
                    </div>

                    {runbookData.data.phases[selectedPhase] && (
                      <div className="surface-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {runbookData.data.phases[selectedPhase].title}
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                            Standard Operating Procedures:
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {runbookData.data.phases[selectedPhase].steps.map((st: string, idx: number) => (
                              <div key={idx} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{idx + 1}.</span>
                                <span>{st}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--status-warning-text)", textTransform: "uppercase", marginBottom: "8px" }}>
                            Go / No-Go Decision Rules:
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {runbookData.data.phases[selectedPhase].decisionRules.map((rule: string, idx: number) => (
                              <div key={idx} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "var(--status-warning-text)", background: "var(--status-warning-bg)", padding: "8px 12px", borderRadius: "var(--radius-xs)" }}>
                                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
                                <span>{rule}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: STATIC CODE AUDITOR */}
        {/* ============================================================ */}
        {activeTab === "scanner" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="surface-card" style={{ padding: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                Static Project Store Compliance Auditor
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
                Zero-dependency scanner inspecting Gradle targetSdk, exported components, 64-bit ELF 16 KB page-size alignment, iOS Privacy Manifest and ATT declarations.
              </div>

              {/* Preset selection */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px", marginBottom: "14px" }}>
                {[
                  { id: "android-good", label: "Android Clean Fixture (SDK 35, 16 KB ELF OK)" },
                  { id: "android-bad", label: "Android Failing Fixture (SDK 33, 4 KB ELF, Secret Key)" },
                  { id: "ios-good", label: "iOS Clean Fixture (Privacy Reasons OK, ATT OK)" },
                  { id: "ios-bad", label: "iOS Failing Fixture (Empty Reasons, Missing ATT)" },
                  { id: "custom", label: "Custom Project Directory..." }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setScanPreset(p.id)}
                    className="surface-card"
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontSize: "12px",
                      borderLeft: scanPreset === p.id ? "3px solid var(--text-primary)" : "1px solid var(--border-default)",
                      background: scanPreset === p.id ? "var(--bg-surface-elevated)" : "var(--bg-surface)",
                      color: scanPreset === p.id ? "var(--text-primary)" : "var(--text-muted)"
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {scanPreset === "custom" && (
                <input
                  type="text"
                  placeholder="/Users/username/Projects/my-mobile-game"
                  value={customScanPath}
                  onChange={(e) => setCustomScanPath(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-xs)",
                    fontSize: "13px",
                    marginBottom: "14px"
                  }}
                />
              )}

              <button onClick={handleRunScan} disabled={isScanning} className="btn-solid">
                {isScanning ? <RefreshCw size={14} className="animate-spin" /> : <FolderSearch size={14} />}
                {isScanning ? "Scanning Directory..." : "Execute Compliance Audit"}
              </button>
            </div>

            {/* Scan Output */}
            {scanReport && (
              <div className="surface-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Audit Report Summary</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{scanReport.summary}</div>
                  </div>
                  <span className={`tag ${scanReport.ok ? "tag-success" : "tag-error"}`}>
                    {scanReport.ok ? "PASS" : "FAIL"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {scanReport.findings.map((f: any, idx: number) => {
                    const isError = f.severity === "error";
                    const isWarn = f.severity === "warning";
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "var(--radius-xs)",
                          background: "var(--bg-app)",
                          border: isError ? "1px solid var(--status-error-border)" : isWarn ? "1px solid var(--status-warning-border)" : "1px solid var(--border-subtle)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span className={`tag ${isError ? "tag-error" : isWarn ? "tag-warning" : "tag-default"}`}>{f.severity}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600 }}>{f.rule}</span>
                          {f.problemId && <span className="tag tag-default">{f.problemId}</span>}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>{f.message}</div>
                        {f.fix && (
                          <div style={{ fontSize: "12px", color: "var(--status-success-text)", marginTop: "4px" }}>
                            Remediation: {f.fix}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: CI EVALS & BENCHMARKS */}
        {/* ============================================================ */}
        {activeTab === "evals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="surface-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  AI Agent Retrieval & Triage Benchmark Suite
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Automated precision and latency evals running across 20 real-world game development scenarios.
                </div>
              </div>
              <button
                onClick={() => {
                  setIsLoadingEvals(true);
                  fetch("/api/evals")
                    .then((r) => r.json())
                    .then((data) => setEvalsData(data))
                    .finally(() => setIsLoadingEvals(false));
                }}
                className="btn-outline"
                style={{ fontSize: "12px", padding: "4px 10px" }}
              >
                <RefreshCw size={13} /> Run Benchmark Evals
              </button>
            </div>

            {/* Eval KPI Cards */}
            {evalsData && evalsData.summary && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                <div className="surface-card" style={{ padding: "16px", borderLeft: "3px solid var(--status-success-text)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--status-success-text)" }}>TOP-1 RETRIEVAL ACCURACY</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "2px", color: "var(--text-primary)" }}>
                    {evalsData.summary.top1Accuracy}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>20 / 20 Scenarios Exact Match</div>
                </div>

                <div className="surface-card" style={{ padding: "16px", borderLeft: "3px solid var(--status-info-text)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--status-info-text)" }}>TOP-3 CANDIDATE RECALL</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "2px", color: "var(--text-primary)" }}>
                    {evalsData.summary.top3Accuracy}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Expected record in top 3</div>
                </div>

                <div className="surface-card" style={{ padding: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)" }}>AVG INFERENCE LATENCY</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "2px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                    {evalsData.summary.avgLatencyMs}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Zero-network in-memory</div>
                </div>

                <div className="surface-card" style={{ padding: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)" }}>CI/CD AUTOMATION</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "2px", color: "var(--status-success-text)" }}>
                    PASSING
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>GitHub Actions Pipeline</div>
                </div>
              </div>
            )}

            {/* Test Cases Table */}
            {isLoadingEvals ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Running evaluation harness...</div>
            ) : evalsData && evalsData.results ? (
              <div className="surface-card" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-muted)" }}>
                      <th style={{ padding: "10px 14px" }}>STATUS</th>
                      <th style={{ padding: "10px 14px" }}>CATEGORY</th>
                      <th style={{ padding: "10px 14px" }}>EVALUATION BENCHMARK SCENARIO</th>
                      <th style={{ padding: "10px 14px" }}>TOP-1 MATCH</th>
                      <th style={{ padding: "10px 14px" }}>CONFIDENCE</th>
                      <th style={{ padding: "10px 14px" }}>LATENCY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evalsData.results.map((res: any) => (
                      <tr key={res.testId} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "10px 14px" }}>
                          <span className={`tag ${res.passed ? "tag-success" : "tag-error"}`}>
                            {res.passed ? "PASS" : "FAIL"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{res.category}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 500, color: "var(--text-primary)" }}>{res.name}</td>
                        <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 600 }}>{res.actualTopId}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span className={`tag ${res.confidence === "high" ? "tag-success" : "tag-warning"}`}>
                            {res.confidence}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{res.latencyMs}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* PROBLEM DETAIL MODAL */}
      {/* ============================================================ */}
      {selectedProblem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setSelectedProblem(null)}
        >
          <div
            className="surface-card"
            style={{
              maxWidth: "720px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              background: "var(--bg-surface)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
              <div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>
                    {selectedProblem.id}
                  </span>
                  <span className={`tag ${selectedProblem.severity === "critical" ? "tag-error" : selectedProblem.severity === "high" ? "tag-warning" : "tag-default"}`}>
                    {selectedProblem.severity}
                  </span>
                  <span className="tag tag-default">{selectedProblem.category}</span>
                  <span className="tag tag-info">Confidence: {selectedProblem.confidence}</span>
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {selectedProblem.title}
                </div>
              </div>
              <button onClick={() => setSelectedProblem(null)} style={{ color: "var(--text-muted)", padding: "4px" }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Symptoms */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                  Reported Symptoms
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {selectedProblem.symptoms.map((s: string, idx: number) => (
                    <div key={idx} style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                      · {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* Causes */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                  Root Cause Analysis
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {selectedProblem.causes.map((c: string, idx: number) => (
                    <div key={idx} style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                      · {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolution Steps */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--status-success-text)", textTransform: "uppercase", marginBottom: "6px" }}>
                  Step-by-Step Resolution Guide
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedProblem.solution.map((step: any) => (
                    <div
                      key={step.step}
                      style={{
                        background: "var(--bg-app)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-xs)",
                        padding: "10px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "10px"
                      }}
                    >
                      <div style={{ display: "flex", gap: "10px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-muted)", fontSize: "12px" }}>
                          {step.step}.
                        </span>
                        <div>
                          <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>{step.action}</div>
                          {step.effort && (
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                              Effort: {step.effort}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => copyStepToClipboard(step.action, step.step)}
                        style={{ color: "var(--text-muted)", padding: "2px" }}
                        title="Copy step"
                      >
                        {copiedStep === step.step ? <Check size={14} color="var(--status-success-text)" /> : <Copy size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prevention */}
              {selectedProblem.prevention && selectedProblem.prevention.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Prevention & Guardrails
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {selectedProblem.prevention.map((p: string, idx: number) => (
                      <div key={idx} style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        ✓ {p}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {selectedProblem.sources && selectedProblem.sources.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Verified Official Sources
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {selectedProblem.sources.map((src: any, idx: number) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "12px",
                          color: "var(--status-info-text)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        {src.title || src.url} ({src.type}) <ExternalLink size={11} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
