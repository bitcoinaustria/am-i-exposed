"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, ShieldX, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNetwork } from "@/context/NetworkContext";
import { checkOfac } from "@/lib/analysis/cex-risk/ofac-check";
import { matchEntitySync } from "@/lib/analysis/entity-filter/entity-match";
import { getEntity } from "@/lib/analysis/entities";
import { extractTxAddresses } from "@/lib/analysis/cex-risk/extract-addresses";
import { useChainalysisCheck } from "@/hooks/useChainalysisCheck";
import { OfacSection } from "@/components/cex/OfacSection";
import { ChainalysisSection } from "@/components/cex/ChainalysisSection";
import type { OfacEntityMatch } from "@/components/cex/OfacSection";
import type { InputType } from "@/lib/types";
import type { MempoolTransaction } from "@/lib/api/types";

interface CexRiskPanelProps {
  query: string;
  inputType: InputType;
  txData: MempoolTransaction | null;
  isCoinJoin?: boolean;
}

export function CexRiskPanel({ query, inputType, txData, isCoinJoin }: CexRiskPanelProps) {
  const { t } = useTranslation();
  const { isUmbrel } = useNetwork();
  const [open, setOpen] = useState(true);

  // Derive addresses to check
  const addresses = useMemo(() => {
    if (inputType === "address") return [query];
    if (inputType === "txid" && txData) return extractTxAddresses(txData);
    return [];
  }, [query, inputType, txData]);

  // OFAC: keep checkOfac only for lastUpdated date
  const ofacLastUpdated = useMemo(() => checkOfac([]).lastUpdated, []);

  // Use matchEntitySync for comprehensive OFAC check (SDN + entity-level flags)
  const ofacMatches = useMemo(() => {
    const matches: OfacEntityMatch[] = [];
    const seen = new Set<string>();
    for (const addr of addresses) {
      const match = matchEntitySync(addr);
      if (match?.ofac) {
        if (seen.has(addr)) continue;
        seen.add(addr);
        const entity = match.entityName ? getEntity(match.entityName) : null;
        matches.push({
          address: addr,
          entityName: match.entityName !== "OFAC Sanctioned" ? match.entityName : null,
          category: entity?.category ?? match.category ?? null,
          country: entity?.country ?? null,
          status: entity?.status ?? null,
        });
      }
    }
    return matches;
  }, [addresses]);

  const ofacSanctioned = ofacMatches.length > 0;

  // Chainalysis screening (opt-in, routed through Cloudflare Worker proxy)
  const {
    chainalysis,
    routeUsed,
    showFallbackConfirm,
    setShowFallbackConfirm,
    runChainalysis,
    runChainalysisDirect,
  } = useChainalysisCheck(addresses, isUmbrel);

  if (addresses.length === 0) return null;

  const hasSanction = ofacSanctioned || chainalysis.sanctioned;

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="cex-risk-panel"
        className="w-full flex items-center gap-2 text-left cursor-pointer group px-1 py-3 min-h-[44px]"
      >
        {hasSanction ? (
          <ShieldX size={14} className="text-severity-critical shrink-0" />
        ) : (
          <ShieldCheck size={14} className="text-foreground/70 group-hover:text-foreground shrink-0" />
        )}
        <span
          className={`text-xs font-medium uppercase tracking-wider ${
            hasSanction ? "text-severity-critical" : "text-foreground/70 group-hover:text-foreground"
          }`}
        >
          {t("cex.exchangeRiskCheck", { defaultValue: "Exchange Risk Check" })}
        </span>
        {hasSanction && (
          <span className="text-xs font-medium text-severity-critical bg-severity-critical/15 px-1.5 py-0.5 rounded">
            {t("cex.flagged", { defaultValue: "FLAGGED" })}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`ml-auto text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div id="cex-risk-panel" className="mt-3 glass rounded-xl p-5 space-y-4">
              <p className="text-sm text-muted">
                {inputType === "txid"
                  ? t("cex.willFlagTx", { defaultValue: "Will exchanges flag this transaction?" })
                  : t("cex.willFlagAddr", { defaultValue: "Will exchanges flag this address?" })}
              </p>

              <OfacSection
                sanctioned={ofacSanctioned}
                matches={ofacMatches}
                lastUpdated={ofacLastUpdated}
              />

              <div className="border-t border-card-border" />

              <ChainalysisSection
                chainalysis={chainalysis}
                routeUsed={routeUsed}
                showFallbackConfirm={showFallbackConfirm}
                setShowFallbackConfirm={setShowFallbackConfirm}
                runChainalysis={runChainalysis}
                runChainalysisDirect={runChainalysisDirect}
                inputType={inputType}
                addressCount={addresses.length}
                isUmbrel={isUmbrel}
              />

              <p className="text-xs text-muted leading-relaxed border-t border-card-border pt-3">
                {isCoinJoin
                  ? t("cex.disclaimerCoinJoin", { defaultValue: "This transaction was identified as a CoinJoin. Multiple centralized exchanges are documented to flag, freeze, or close accounts for CoinJoin-associated deposits - even months or years after the transaction. These checks cover sanctions screening only and cannot predict exchange compliance decisions." })
                  : t("cex.disclaimer", { defaultValue: "These checks cover sanctions screening only. Exchanges may flag addresses for other reasons (mixer usage, high-risk jurisdiction, etc.) that are not detectable with public tools." })}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
