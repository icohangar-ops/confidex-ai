"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  FileText,
  ChevronDown,
  ChevronUp,
  Play,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Info,
  Mic,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfidexStore, DocumentType } from "@/lib/confidex-store";

const analysisTypes = [
  "Financial Risk",
  "Legal Compliance",
  "Valuation Assessment",
  "Synergy Analysis",
];

interface Finding {
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
}

interface AnalysisResult {
  riskScore: number;
  findings: Finding[];
}

const demoResults: Record<string, AnalysisResult> = {
  "Financial Risk": {
    riskScore: 72,
    findings: [
      {
        severity: "high",
        title: "Revenue Concentration Risk",
        description:
          "85% of revenue from top 3 clients. Any loss of a major client could significantly impact earnings.",
      },
      {
        severity: "medium",
        title: "Debt-to-EBITDA Elevated",
        description:
          "Current ratio of 4.2x exceeds industry median of 3.0x. Consider debt restructuring in Q3.",
      },
      {
        severity: "low",
        title: "Cash Flow Positive Trend",
        description:
          "Operating cash flow improved 22% YoY. Free cash flow margin at 8.3% is healthy.",
      },
    ],
  },
  "Legal Compliance": {
    riskScore: 45,
    findings: [
      {
        severity: "medium",
        title: "Pending Regulatory Review",
        description:
          "SEC comment letter outstanding for S-1 amendment. Expected resolution within 60 days.",
      },
      {
        severity: "low",
        title: "IP Litigation Exposure",
        description:
          "Minor patent dispute in Eastern District of Texas. Probability of material loss estimated at 5%.",
      },
      {
        severity: "low",
        title: "GDPR Compliance Strong",
        description:
          "Full compliance with EU data protection standards. DPO appointed and audit trail intact.",
      },
    ],
  },
  "Valuation Assessment": {
    riskScore: 58,
    findings: [
      {
        severity: "high",
        title: "DCF Valuation Gap",
        description:
          "Management DCF of $300M vs buyer model of $220M. 36% gap driven by divergent growth assumptions.",
      },
      {
        severity: "medium",
        title: "Comparable Analysis Favorable",
        description:
          "EV/Revenue multiple of 6.2x is below sector median of 7.8x, suggesting potential upside.",
      },
      {
        severity: "medium",
        title: "Synergy Value Uncertain",
        description:
          "Projected $45M in annual synergies assumes aggressive timeline. Recommend 18-month phase-in.",
      },
    ],
  },
  "Synergy Analysis": {
    riskScore: 35,
    findings: [
      {
        severity: "medium",
        title: "Technology Integration",
        description:
          "Combined entity would hold 12 overlapping SaaS products. Recommend portfolio rationalization within 12 months.",
      },
      {
        severity: "low",
        title: "Geographic Overlap Minimal",
        description:
          "Minimal market overlap reduces cannibalization risk. Strong cross-sell opportunity in EMEA.",
      },
      {
        severity: "high",
        title: "Cultural Alignment Risk",
        description:
          "Employee satisfaction surveys diverge significantly. Recommend retention packages for key engineers.",
      },
    ],
  },
};

const progressSteps = [
  { label: "Submitting CTX request...", duration: 800 },
  { label: "Decrypting via CTX...", duration: 1500 },
  { label: "AI processing with GLM-4-Plus...", duration: 2000 },
  { label: "Generating encrypted report...", duration: 1000 },
];

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "high") return <AlertCircle className="w-4 h-4 text-red-400" />;
  if (severity === "medium") return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <Info className="w-4 h-4 text-blue-400" />;
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls =
    severity === "high"
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : severity === "medium"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return (
    <Badge variant="outline" className={`text-[10px] ${cls}`}>
      {severity.toUpperCase()}
    </Badge>
  );
}

export function AIAnalysisPanel() {
  const { documents, selectedDocument, setSelectedDocument } = useConfidexStore();
  const [analysisType, setAnalysisType] = useState(analysisTypes[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expandedFindings, setExpandedFindings] = useState<Set<number>>(new Set());

  async function runAnalysis() {
    if (!selectedDocument) return;
    setIsRunning(true);
    setResult(null);
    setProgressPct(0);

    for (let i = 0; i < progressSteps.length; i++) {
      const step = progressSteps[i];
      setProgressLabel(step.label);
      setProgressPct(((i + 1) / progressSteps.length) * 100);
      await new Promise((r) => setTimeout(r, step.duration));
    }

    await new Promise((r) => setTimeout(r, 500));
    setResult(demoResults[analysisType]);
    setIsRunning(false);
    setProgressLabel("");
  }

  function toggleFinding(idx: number) {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  const riskColor =
    (result?.riskScore ?? 0) > 60
      ? "text-red-400"
      : (result?.riskScore ?? 0) > 40
      ? "text-amber-400"
      : "text-emerald-400";

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-2">
            AI Due Diligence{" "}
            <span className="text-teal-400">Engine</span>
          </h2>
          <p className="text-slate-400 mb-10">
            Powered by GLM-4-Plus. Analyzes encrypted documents through SKALE
            Conditional Transactions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  Select Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedDocument?.id ?? ""}
                  onValueChange={(id) =>
                    setSelectedDocument(
                      documents.find((d) => d.id === id) ?? null
                    )
                  }
                >
                  <SelectTrigger className="bg-slate-950 border-slate-700">
                    <SelectValue placeholder="Choose a document…" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="w-4 h-4 text-amber-400" />
                  Analysis Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={analysisType}
                  onValueChange={setAnalysisType}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {analysisTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Button
              onClick={runAnalysis}
              disabled={!selectedDocument || isRunning}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>

            {/* Progress */}
            <AnimatePresence>
              {(isRunning || progressPct > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Progress value={progressPct} className="h-2" />
                  <p className="text-xs text-slate-400 text-center">
                    {progressLabel}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right: Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-900/60 border-slate-800 h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Analysis Results</CardTitle>
                  {result && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                      GLM-4-Plus
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {/* Risk Score */}
                      <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400">
                            Risk Score
                          </span>
                          <span
                            className={`text-3xl font-bold ${riskColor}`}
                          >
                            {result.riskScore}
                            <span className="text-sm text-slate-500">/100</span>
                          </span>
                        </div>
                        <Progress
                          value={result.riskScore}
                          className="h-2"
                        />
                      </div>

                      {/* Findings */}
                      <div className="space-y-2">
                        {result.findings.map((f, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-slate-800 bg-slate-950/40 overflow-hidden"
                          >
                            <button
                              onClick={() => toggleFinding(i)}
                              className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800/30 transition-colors"
                            >
                              <SeverityIcon severity={f.severity} />
                              <span className="flex-1 text-sm text-slate-200 font-medium">
                                {f.title}
                              </span>
                              <SeverityBadge severity={f.severity} />
                              {expandedFindings.has(i) ? (
                                <ChevronUp className="w-4 h-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              )}
                            </button>
                            <AnimatePresence>
                              {expandedFindings.has(i) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="px-3 pb-3 pl-10"
                                >
                                  <p className="text-sm text-slate-400 leading-relaxed">
                                    {f.description}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-16 text-slate-500"
                    >
                      <Brain className="w-10 h-10 mb-3 text-slate-600" />
                      <p className="text-sm">
                        Select a document and run analysis to see results
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Voice Briefing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-teal-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">
                    Voice Briefing
                  </p>
                  <p className="text-xs text-slate-500">
                    AI-generated deal summary via Deepgram Aura TTS
                  </p>
                </div>
                {/* Waveform bars */}
                <div className="flex items-end gap-[3px] h-8">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full bg-teal-400/60"
                      animate={{
                        height: [4, 20, 8, 28, 12, 24, 6, 16, 10, 22, 8, 18][i],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.05,
                      }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
