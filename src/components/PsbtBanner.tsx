"use client";

import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ShieldAlert } from "lucide-react";
import { formatSats } from "@/lib/format";

interface PsbtBannerProps {
  inputCount: number;
  outputCount: number;
  fee: number;
  feeRate: number;
  complete: boolean;
}

export function PsbtBanner({ inputCount, outputCount, fee, feeRate, complete }: PsbtBannerProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      key="psbt-banner"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mb-4"
    >
      <div className="rounded-xl border border-bitcoin/30 bg-bitcoin/5 px-5 py-4 space-y-2">
        <div className="flex items-center gap-2 text-bitcoin font-semibold text-sm">
          <ShieldAlert size={16} />
          {t("psbt.banner", { defaultValue: "Pre-broadcast privacy analysis (PSBT)" })}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted">
          <div>
            <span className="block text-foreground font-medium">{inputCount}</span>
            {t("psbt.inputs", { defaultValue: "Inputs" })}
          </div>
          <div>
            <span className="block text-foreground font-medium">{outputCount}</span>
            {t("psbt.outputs", { defaultValue: "Outputs" })}
          </div>
          <div>
            <span className="block text-foreground font-medium">
              {fee > 0 ? formatSats(fee) : "N/A"}
            </span>
            {t("psbt.fee", { defaultValue: "Fee" })}
          </div>
          <div>
            <span className="block text-foreground font-medium">
              {feeRate > 0 ? `${feeRate} sat/vB` : "N/A"}
            </span>
            {t("psbt.feeRate", { defaultValue: "Fee rate" })}
          </div>
        </div>
        {!complete && (
          <p className="text-xs text-severity-medium">
            {t("psbt.incomplete", { defaultValue: "Some inputs are missing UTXO data. Fee calculation may be incomplete." })}
          </p>
        )}
      </div>
    </motion.div>
  );
}
