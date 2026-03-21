"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { TX_BASE_SCORE, ADDRESS_BASE_SCORE } from "@/lib/scoring/score";
import { FindingsTier } from "../FindingsTier";
import { AnalystView } from "../AnalystView";
import { ScoreAlertBlock } from "./ScoreAlertBlock";
import { SidebarRecommendations } from "./SidebarRecommendations";
import { SidebarWarnings } from "./SidebarWarnings";
import { ScoreWaterfallCollapsible } from "./ScoreWaterfallCollapsible";
import type { ScoringResult, Finding } from "@/lib/types";
import type { MempoolTransaction, MempoolAddress } from "@/lib/api/types";
import type { PreSendResult } from "@/lib/analysis/orchestrator";

interface ResultsSidebarProps {
  query: string;
  inputType: "txid" | "address";
  result: ScoringResult;
  txData: MempoolTransaction | null;
  addressData: MempoolAddress | null;
  preSendResult?: PreSendResult | null;
  proMode: boolean;
  devMode: boolean;
  isCoinJoin: boolean;
  detectedWallet: string | null;
  details: Finding[];
  strengths: Finding[];
  onScan?: (input: string) => void;
  onFindingClick: (findingId: string) => void;
}

export const ResultsSidebar = memo(function ResultsSidebar({
  query,
  inputType,
  result,
  txData,
  addressData,
  preSendResult,
  proMode,
  devMode,
  isCoinJoin,
  detectedWallet,
  details,
  strengths,
  onScan,
  onFindingClick,
}: ResultsSidebarProps) {
  const { t } = useTranslation();

  return (
    <div className={`w-full ${proMode ? "xl:w-[380px] 2xl:w-[420px] xl:shrink-0" : ""} flex flex-col gap-5 sm:gap-6`}>

      {/* Score + alerts - desktop sidebar only in Pro (Simple shows inline above) */}
      {proMode && (
        <div className="hidden xl:flex flex-col gap-5">
          <ScoreAlertBlock result={result} inputType={inputType} preSendResult={preSendResult} proMode={proMode} />
        </div>
      )}

      {/* Recommendations - sidebar PrimaryRecommendation only in Pro (Simple shows inline above) */}
      {proMode && <SidebarRecommendations result={result} detectedWallet={detectedWallet} devMode={devMode} />}

      {/* Additional findings, strengths, score waterfall (sidebar, Pro only) */}
      {proMode && details.length > 0 && (
        <FindingsTier
          findings={details}
          label={t("results.additionalFindings", { count: details.length, defaultValue: "Additional findings ({{count}})" })}
          defaultOpen={true}
          delay={0.25}
          onTxClick={onScan}
          proMode={proMode}
        />
      )}

      {proMode && strengths.length > 0 && (
        <FindingsTier
          findings={strengths}
          label={t("results.privacyStrengths", { count: strengths.length, defaultValue: "Privacy strengths ({{count}})" })}
          defaultOpen={true}
          delay={0.3}
          onTxClick={onScan}
          proMode={proMode}
        />
      )}

      {proMode && result.findings.some((f) => f.scoreImpact !== 0) && (
        <ScoreWaterfallCollapsible
          findings={result.findings}
          score={result.score}
          grade={result.grade}
          baseScore={addressData ? ADDRESS_BASE_SCORE : TX_BASE_SCORE}
          onFindingClick={onFindingClick}
          delay={0.35}
        />
      )}

      {/* Contextual Warnings (sidebar) */}
      <SidebarWarnings
        query={query}
        inputType={inputType}
        txData={txData}
        isCoinJoin={isCoinJoin}
        result={result}
      />

      {/* Diagnostics (sidebar) */}
      {inputType === "txid" && result.findings.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.58 }} className="w-full">
          <AnalystView findings={result.findings} grade={result.grade} />
        </motion.div>
      )}
    </div>
  );
});
