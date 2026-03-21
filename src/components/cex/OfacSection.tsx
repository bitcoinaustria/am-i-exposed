"use client";

import { ShieldX, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

const CATEGORY_LABELS: Record<string, string> = {
  exchange: "Exchange",
  darknet: "Darknet Market",
  scam: "Scam",
  gambling: "Gambling",
  payment: "Payment Processor",
  mining: "Mining Pool",
  mixer: "Mixer",
  p2p: "P2P Platform",
};

export interface OfacEntityMatch {
  address: string;
  entityName: string | null;
  category: string | null;
  country: string | null;
  status: string | null;
}

interface OfacSectionProps {
  sanctioned: boolean;
  matches: OfacEntityMatch[];
  lastUpdated: string;
}

export function OfacSection({ sanctioned, matches, lastUpdated }: OfacSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">
        {sanctioned ? (
          <ShieldX size={16} className="text-severity-critical" />
        ) : (
          <ShieldCheck size={16} className="text-severity-good" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {t("cex.ofacTitle", { defaultValue: "OFAC Sanctions List" })}
          </span>
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              sanctioned
                ? "bg-severity-critical/15 text-severity-critical"
                : "bg-severity-good/15 text-severity-good"
            }`}
          >
            {sanctioned ? t("cex.flagged", { defaultValue: "FLAGGED" }) : t("cex.clear", { defaultValue: "Clear" })}
          </span>
        </div>
        {sanctioned ? (
          <div className="mt-1 space-y-2">
            <p className="text-xs text-severity-critical">
              {matches.length > 1
                ? t("cex.ofacFlaggedPlural", { count: matches.length, defaultValue: "{{count}} sanctioned addresses found. Exchanges will likely freeze funds associated with these addresses." })
                : t("cex.ofacFlaggedSingular", { defaultValue: "1 sanctioned address found. Exchanges will likely freeze funds associated with this address." })}
            </p>
            <div className="space-y-1.5">
              {matches.map((m) => (
                <div
                  key={m.address}
                  className="bg-severity-critical/10 rounded-lg px-3 py-2 space-y-1"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {m.entityName && (
                      <span className="text-xs font-medium text-severity-critical">
                        {m.entityName}
                      </span>
                    )}
                    {m.category && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-severity-critical/15 text-severity-critical">
                        {CATEGORY_LABELS[m.category] ?? m.category}
                      </span>
                    )}
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-severity-critical/20 text-severity-critical font-semibold">
                      OFAC
                    </span>
                    {m.status === "closed" && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-foreground/10 text-foreground/60">
                        Closed
                      </span>
                    )}
                    {m.country && m.country !== "Unknown" && (
                      <span className="text-[10px] text-muted">{m.country}</span>
                    )}
                  </div>
                  <code className="block text-xs font-mono text-severity-critical/90 break-all">
                    {m.address}
                  </code>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted mt-0.5">
            {t("cex.ofacClear", { defaultValue: "Checked against US Treasury SDN list. Client-side - no data sent." })}
          </p>
        )}
        <p className="text-xs text-muted mt-1">
          {t("cex.lastUpdated", { date: lastUpdated, defaultValue: "Last updated: {{date}}" })}
        </p>
      </div>
    </div>
  );
}
