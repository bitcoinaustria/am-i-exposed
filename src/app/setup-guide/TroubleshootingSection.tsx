"use client";

import { useTranslation } from "react-i18next";
import { TROUBLESHOOTING_ITEMS } from "./setup-guide-data";

export function TroubleshootingSection() {
  const { t } = useTranslation();

  return (
    <section id="troubleshooting" className="space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">
        {t("setup.troubleshooting_title", { defaultValue: "Troubleshooting" })}
      </h2>
      <div className="space-y-3">
        {TROUBLESHOOTING_ITEMS.map((item) => {
          const error = t(item.errorKey, { defaultValue: item.errorDefault });
          const cause = t(item.causeKey, { defaultValue: item.causeDefault });
          const fix = t(item.fixKey, { defaultValue: item.fixDefault });
          return (
            <div
              key={item.errorKey}
              className="bg-card-bg border border-card-border rounded-xl p-5 space-y-2 hover:border-bitcoin/20 transition-colors"
            >
              <h3 className="text-sm font-semibold text-foreground">{error}</h3>
              <p className="text-xs text-muted">
                <span className="text-warning font-medium">{t("setup.cause", { defaultValue: "Cause:" })}</span> {cause}
              </p>
              <p className="text-sm text-muted leading-relaxed">{fix}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
