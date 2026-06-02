"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Building2,
  Users,
  FileText,
  Shield,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useConfidexStore,
  DealState,
  DocumentStatus,
} from "@/lib/confidex-store";

const dealStages: { key: DealState; label: string }[] = [
  { key: DealState.Created, label: "Created" },
  { key: DealState.DueDiligence, label: "Due Diligence" },
  { key: DealState.Negotiation, label: "Negotiation" },
  { key: DealState.PendingApproval, label: "Pending Approval" },
  { key: DealState.Completed, label: "Completed" },
];

function statusColor(status: DocumentStatus) {
  switch (status) {
    case DocumentStatus.Encrypted:
      return "bg-slate-500/20 text-slate-400 border-slate-600/40";
    case DocumentStatus.AgentAccess:
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case DocumentStatus.AuditorAccess:
      return "bg-violet-500/15 text-violet-400 border-violet-500/30";
  }
}

export function DealRoomDashboard() {
  const { dealState, documents, participants, selectedDocument, setSelectedDocument } =
    useConfidexStore();
  const [showValue, setShowValue] = useState(false);

  const stageIndex = dealStages.findIndex((s) => s.key === dealState);
  const progressValue = ((stageIndex + 1) / dealStages.length) * 100;

  function handleViewEncrypted() {
    toast.success("Decryption request submitted via CTX", {
      description:
        "Threshold nodes are decrypting. Only authorized parties will receive the key.",
    });
  }

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-2">Confidential Deal Rooms</h2>
          <p className="text-slate-400 mb-10">
            Active deal room with encrypted documents and participant management.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deal Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="w-5 h-5 text-teal-400" />
                    TechCorp Acquisition
                  </CardTitle>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                    {dealState}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Encrypted Value */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">
                      Deal Value (Encrypted)
                    </span>
                    <div className="text-2xl font-bold mt-1 flex items-center gap-3">
                      {showValue ? (
                        <span className="text-emerald-400">$245,000,000</span>
                      ) : (
                        <span className="text-slate-600 font-mono">
                          0x7f3a...e821
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowValue(!showValue)}
                    className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    {showValue ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    {dealStages.map((s, i) => (
                      <span
                        key={s.key}
                        className={
                          i <= stageIndex ? "text-emerald-400 font-medium" : ""
                        }
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>

                {/* Token Balances */}
                <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">
                    DSTK Balances (Encrypted)
                  </span>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {[
                      { name: "MegaCorp", bal: "0xa1...████" },
                      { name: "Goldman Legal", bal: "0x3e...████" },
                      { name: "DeepVault AI", bal: "0x8b...████" },
                      { name: "Ernst Audit", bal: "0xf2...████" },
                    ].map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-400">{p.name}</span>
                        <span className="text-slate-600 font-mono text-xs">
                          {p.bal}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Participants Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-900/60 border-slate-800 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-teal-400" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            p.hasAccess
                              ? "border-emerald-500/30 text-emerald-400"
                              : "border-slate-600 text-slate-500"
                          }`}
                        >
                          {p.role}
                        </Badge>
                        <span
                          className={`text-[10px] ${
                            p.hasAccess ? "text-emerald-400" : "text-slate-500"
                          }`}
                        >
                          {p.hasAccess ? "Active" : "Pending"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono hidden sm:inline">
                      {p.walletAddress}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Documents Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-teal-400" />
                Deal Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                      <th className="pb-3 pr-4">Document</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4 hidden sm:table-cell">Hash</th>
                      <th className="pb-3 pr-4 hidden md:table-cell">Size</th>
                      <th className="pb-3 pr-4 hidden lg:table-cell">
                        Uploaded
                      </th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {documents.map((doc) => (
                      <tr
                        key={doc.id}
                        className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${
                          selectedDocument?.id === doc.id
                            ? "bg-slate-800/50"
                            : ""
                        }`}
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-slate-500 shrink-0" />
                            <span className="text-slate-200 font-medium truncate max-w-[200px]">
                              {doc.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant="outline"
                            className={`text-[11px] ${statusColor(doc.status)}`}
                          >
                            {doc.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-slate-500 font-mono text-xs hidden sm:table-cell">
                          {doc.encryptedHash}
                        </td>
                        <td className="py-3 pr-4 text-slate-400 hidden md:table-cell">
                          {doc.size}
                        </td>
                        <td className="py-3 pr-4 text-slate-500 hidden lg:table-cell">
                          {doc.uploadedAt}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewEncrypted();
                            }}
                            className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                          >
                            View Encrypted
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
