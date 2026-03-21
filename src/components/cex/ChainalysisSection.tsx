"use client";

import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Search,
  RotateCw,
} from "lucide-react";
import { Spinner } from "../ui/Spinner";
import { useTranslation } from "react-i18next";
import type { InputType } from "@/lib/types";
import type { ChainalysisCheckResult } from "@/lib/analysis/cex-risk/types";
import type { ChainalysisRoute } from "@/lib/analysis/cex-risk/chainalysis-check";

interface ChainalysisSectionProps {
  chainalysis: ChainalysisCheckResult;
  routeUsed: ChainalysisRoute | null;
  showFallbackConfirm: boolean;
  setShowFallbackConfirm: (show: boolean) => void;
  runChainalysis: () => void;
  runChainalysisDirect: () => void;
  inputType: InputType;
  addressCount: number;
  isUmbrel: boolean;
}

export function ChainalysisSection({
  chainalysis,
  routeUsed,
  showFallbackConfirm,
  setShowFallbackConfirm,
  runChainalysis,
  runChainalysisDirect,
  inputType,
  addressCount,
  isUmbrel,
}: ChainalysisSectionProps) {
  const { t } = useTranslation();
  const cappedCount = Math.min(addressCount, 20);

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">
        {chainalysis.status === "done" ? (
          chainalysis.sanctioned ? (
            <ShieldX size={16} className="text-severity-critical" />
          ) : (
            <ShieldCheck size={16} className="text-severity-good" />
          )
        ) : chainalysis.status === "loading" ? (
          <Spinner size="sm" />
        ) : chainalysis.status === "error" ? (
          <ShieldAlert size={16} className="text-severity-high" />
        ) : (
          <ShieldAlert size={16} className="text-muted" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {t("cex.chainalysisTitle", { defaultValue: "Chainalysis Screening" })}
          </span>
          {chainalysis.status === "done" && (
            <>
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  chainalysis.sanctioned
                    ? "bg-severity-critical/15 text-severity-critical"
                    : "bg-severity-good/10 text-severity-good"
                }`}
              >
                {chainalysis.sanctioned ? t("cex.flagged", { defaultValue: "FLAGGED" }) : t("cex.clear", { defaultValue: "Clear" })}
              </span>
              {routeUsed && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    routeUsed === "tor-proxy"
                      ? "bg-severity-good/10 text-severity-good"
                      : "bg-severity-medium/10 text-severity-medium"
                  }`}
                >
                  {routeUsed === "tor-proxy"
                    ? t("cex.routedViaTor", { defaultValue: "via Tor" })
                    : t("cex.routedDirect", { defaultValue: "direct" })}
                </span>
              )}
            </>
          )}
        </div>

        {chainalysis.status === "idle" && !showFallbackConfirm && (
          <div className="mt-1.5">
            <button
              onClick={runChainalysis}
              className="inline-flex items-center gap-2 text-sm font-medium text-bitcoin hover:text-bitcoin-hover bg-bitcoin/10 hover:bg-bitcoin/20 rounded-lg px-3 py-2.5 transition-colors cursor-pointer"
            >
              <Search size={14} />
              {t("cex.runChainalysis", { defaultValue: "Run Chainalysis Check" })}
              {inputType === "txid" && addressCount > 1 && (
                <span className="text-muted text-xs">
                  ({t("cex.addressCount", { count: cappedCount, defaultValue: "{{count}} address", defaultValue_other: "{{count}} addresses" })})
                </span>
              )}
            </button>
            <p className="text-xs text-severity-medium mt-1 flex items-center gap-1.5">
              <AlertTriangle size={12} className="shrink-0" />
              {isUmbrel
                ? t("cex.privacyNoteTor", { defaultValue: "Routed through Tor to protect your IP. Chainalysis sees the address but not your identity." })
                : inputType === "txid" && addressCount > 1
                  ? t("cex.privacyWarningPlural", { defaultValue: "Sends addresses to chainalysis.com via proxy. The proxy operator also sees the addresses." })
                  : t("cex.privacyWarningSingular", { defaultValue: "Sends address to chainalysis.com via proxy. The proxy operator also sees the addresses." })}
            </p>
          </div>
        )}

        {showFallbackConfirm && (
          <div className="mt-1.5 bg-severity-medium/5 border border-severity-medium/20 rounded-lg p-3 space-y-2">
            <p className="text-xs text-severity-medium flex items-center gap-1.5">
              <AlertTriangle size={12} className="shrink-0" />
              {t("cex.torFailed", {
                defaultValue: "Tor proxy is unavailable. Proceeding will send the request directly - Chainalysis and the proxy operator will see your IP address.",
              })}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={runChainalysisDirect}
                className="text-xs font-medium text-severity-medium hover:text-severity-medium/80 bg-severity-medium/10 hover:bg-severity-medium/20 rounded-lg px-3 py-2 transition-colors cursor-pointer"
              >
                {t("cex.proceedDirect", { defaultValue: "Proceed without Tor" })}
              </button>
              <button
                onClick={() => setShowFallbackConfirm(false)}
                className="text-xs font-medium text-muted hover:text-foreground/80 bg-surface-inset hover:bg-surface-inset/80 rounded-lg px-3 py-2 transition-colors cursor-pointer"
              >
                {t("cex.cancel", { defaultValue: "Cancel" })}
              </button>
            </div>
          </div>
        )}

        {chainalysis.status === "loading" && (
          <p className="text-sm text-muted mt-1">
            {t("cex.checking", { count: cappedCount, defaultValue: "Checking {{count}} address...", defaultValue_other: "Checking {{count}} addresses..." })}
          </p>
        )}

        {chainalysis.status === "done" && !chainalysis.sanctioned && (
          <p className="text-sm text-muted mt-0.5">
            {inputType === "txid"
              ? t("cex.chainalysisClearTx", { defaultValue: "No sanctions identified. Exchanges are unlikely to flag this transaction." })
              : t("cex.chainalysisClearAddr", { defaultValue: "No sanctions identified. Exchanges are unlikely to flag this address." })}
          </p>
        )}

        {chainalysis.status === "done" && chainalysis.sanctioned && (
          <div className="mt-1 space-y-1">
            <p className="text-xs text-severity-critical">
              {t("cex.sanctionsIdentified", { defaultValue: "Sanctions identified. Exchanges will likely freeze funds." })}
            </p>
            {chainalysis.identifications.map((id, i) => (
              <div key={i} className="bg-severity-critical/5 rounded px-2 py-1 text-xs">
                <span className="text-severity-critical font-medium">{id.category}</span>
                {id.name && <span className="text-foreground"> - {id.name}</span>}
              </div>
            ))}
            <div className="space-y-0.5">
              {chainalysis.matchedAddresses.map((addr) => (
                <code key={addr} className="block text-xs font-mono text-severity-critical/80 break-all">
                  {addr}
                </code>
              ))}
            </div>
          </div>
        )}

        {chainalysis.status === "error" && (
          <div className="mt-1 space-y-1">
            <p className="text-xs text-severity-high">
              {chainalysis.error || t("cex.requestFailed", { defaultValue: "Request failed. Check your internet connection and try again." })}
            </p>
            <button
              onClick={runChainalysis}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-bitcoin hover:text-bitcoin-hover bg-bitcoin/10 hover:bg-bitcoin/20 rounded-lg px-3 py-2 transition-colors cursor-pointer"
            >
              <RotateCw size={14} />
              {t("cex.retry", { defaultValue: "Retry" })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
