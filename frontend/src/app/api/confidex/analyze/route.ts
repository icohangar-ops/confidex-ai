import { NextRequest, NextResponse } from "next/server";

/* ─── Simulated analysis results ────────────────────────── */

const analysisDatabase: Record<
  string,
  {
    riskScore: number;
    findings: {
      severity: "high" | "medium" | "low";
      title: string;
      description: string;
      recommendation: string;
    }[];
    summary: string;
    confidence: number;
    processingTimeMs: number;
  }
> = {
  "Financial Risk": {
    riskScore: 72,
    summary:
      "Elevated financial risk detected. Revenue concentration and elevated leverage ratios require further scrutiny before deal closure.",
    confidence: 94,
    processingTimeMs: 4200,
    findings: [
      {
        severity: "high",
        title: "Revenue Concentration Risk",
        description:
          "85% of total revenue ($187.4M of $220.5M) derived from top 3 enterprise clients. Loss of any single major client could reduce annual revenue by 25-30%.",
        recommendation:
          "Require multi-year contract extensions from top 3 clients as deal condition. Implement revenue diversification milestone in earn-out agreement.",
      },
      {
        severity: "medium",
        title: "Debt-to-EBITDA Ratio Elevated",
        description:
          "Current leverage of 4.2x EBITDA exceeds industry median of 3.0x. Total debt of $892M includes $340M in revolving credit facilities with variable rates.",
        recommendation:
          "Mandate debt reduction plan targeting 3.5x EBITDA within 18 months post-acquisition. Capex reduction from 12% to 8% of revenue.",
      },
      {
        severity: "low",
        title: "Positive Cash Flow Trajectory",
        description:
          "Operating cash flow improved 22% YoY to $48.3M. Free cash flow margin at 8.3% exceeds sector average of 5.1%. Working capital cycle reduced by 8 days.",
        recommendation:
          "Factor positive FCF trend into valuation model. Consider accelerated earn-out structure tied to FCF targets.",
      },
    ],
  },
  "Legal Compliance": {
    riskScore: 45,
    summary:
      "Moderate legal risk with one outstanding regulatory matter and minor IP litigation. Overall compliance posture is strong.",
    confidence: 91,
    processingTimeMs: 3800,
    findings: [
      {
        severity: "medium",
        title: "SEC Comment Letter Outstanding",
        description:
          "S-1 amendment filed 45 days ago with 3 outstanding comment items from SEC Division of Corporation Finance. Expected resolution within 60 days.",
        recommendation:
          "Obtain written confirmation from issuer's counsel regarding SEC comment resolution timeline. Consider deal contingency clause tied to registration effectiveness.",
      },
      {
        severity: "low",
        title: "IP Patent Dispute — Eastern District of Texas",
        description:
          "Patent infringement suit filed by non-practicing entity (Case No. 2:26-cv-00342). Claim for $12M in damages. MKM probability analysis estimates 5% probability of material adverse judgment.",
        recommendation:
          "Secure representation and warranty insurance (RWI) coverage for IP claims up to $15M. No deal-breaker at current exposure level.",
      },
      {
        severity: "low",
        title: "GDPR & Data Protection Compliance",
        description:
          "Full EU GDPR compliance confirmed. Data Protection Officer appointed since 2023. Last DPA audit (Q4 2025) passed with zero material findings. Cookie consent and data retention policies up to date.",
        recommendation:
          "No action required. Verify DPO continuity post-acquisition in integration plan.",
      },
    ],
  },
  "Valuation Assessment": {
    riskScore: 58,
    summary:
      "Significant valuation gap between buyer and seller models. DCF methodology and synergy assumptions drive the 36% spread. Comparable analysis suggests fair value near the midpoint.",
    confidence: 87,
    processingTimeMs: 5100,
    findings: [
      {
        severity: "high",
        title: "DCF Valuation Gap — $80M Spread",
        description:
          "Seller management DCF yields $300M enterprise value (12.0x EV/EBITDA, 8% WACC, 15% terminal growth). Buyer model yields $220M (8.8x EV/EBITDA, 10% WACC, 3% terminal growth). $80M spread driven by divergent growth and discount rate assumptions.",
        recommendation:
          "Engage independent valuation advisor to bridge models. Consider collar structure: $230M-$270M with 50/50 split above/below midpoint. Tie $20M to post-close revenue milestones.",
      },
      {
        severity: "medium",
        title: "Comparable Company Analysis — Below Median",
        description:
          "Proposed deal at 6.2x EV/Revenue is below sector median of 7.8x and target company's own 5-year average of 7.1x. Suggests potential upside if market conditions stabilize.",
        recommendation:
          "Use comparable analysis as supporting valuation floor. Sector multiple expansion could justify higher offer if revenue acceleration materializes.",
      },
      {
        severity: "medium",
        title: "Synergy Realization Uncertainty",
        description:
          "Management projects $45M in annual run-rate synergies by Year 3. Buyer model assumes $28M with 18-month phase-in. Revenue synergies (cross-sell, geographic expansion) are least certain at $8M projected.",
        recommendation:
          "Structure $30M of purchase price as contingent consideration tied to synergy milestones: $12M cost synergy, $8M revenue synergy, $10M technology integration milestone.",
      },
    ],
  },
  "Synergy Analysis": {
    riskScore: 35,
    summary:
      "Low overall synergy risk with strong geographic complementarity. Technology integration complexity and cultural alignment are the primary execution challenges.",
    confidence: 89,
    processingTimeMs: 4600,
    findings: [
      {
        severity: "medium",
        title: "Technology Portfolio Overlap",
        description:
          "Combined entity would operate 12 SaaS products with 40% feature overlap across CRM, analytics, and automation categories. Annual R&D cost of $28M on overlapping products.",
        recommendation:
          "Commission technology rationalization study pre-close. Plan 12-month sunset schedule for 4 redundant products. Migrate users to unified platform within 18 months.",
      },
      {
        severity: "low",
        title: "Geographic Market Complementarity",
        description:
          "Minimal geographic overlap. Seller strong in EMEA (62% revenue), buyer strong in North America (71% revenue). Combined entity covers 47 countries vs 28 and 23 respectively. Cross-sell potential estimated at $18M annually.",
        recommendation:
          "Prioritize EMEA-NAM cross-sell motion in Day 1 integration plan. Establish regional co-leadership structure with unified go-to-market playbook.",
      },
      {
        severity: "high",
        title: "Cultural Alignment Risk",
        description:
          "Employee satisfaction scores diverge significantly: seller at 4.1/5.0, buyer at 3.3/5.0. Attrition risk for seller's top 50 engineers estimated at 15% post-acquisition without retention measures. Total engineering headcount at risk: ~75 staff.",
        recommendation:
          "Allocate $8M retention pool for key technical talent. Implement stay bonuses with 24-month vesting. Establish joint innovation council to preserve seller's engineering culture.",
      },
    ],
  },
};

/* ─── POST handler ─────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, analysisType } = body;

    if (!documentId || !analysisType) {
      return NextResponse.json(
        { error: "documentId and analysisType are required" },
        { status: 400 }
      );
    }

    const validTypes = [
      "Financial Risk",
      "Legal Compliance",
      "Valuation Assessment",
      "Synergy Analysis",
    ];

    if (!validTypes.includes(analysisType)) {
      return NextResponse.json(
        { error: `Invalid analysisType. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );

    const result = analysisDatabase[analysisType];

    return NextResponse.json({
      success: true,
      documentId,
      analysisType,
      timestamp: new Date().toISOString(),
      model: "GLM-4-Plus",
      decryptionMethod: "SKALE BITE CTX",
      ...result,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
