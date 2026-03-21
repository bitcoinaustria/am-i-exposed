"use client";

import { Suspense, lazy, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ShieldCheck, EyeOff, Github } from "lucide-react";
import { AddressInput } from "@/components/AddressInput";
import { ScanHistory } from "@/components/ScanHistory";
import { EXAMPLES } from "@/lib/constants";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useDevMode } from "@/hooks/useDevMode";
import type { RecentScan } from "@/hooks/useRecentScans";
import type { Bookmark } from "@/hooks/useBookmarks";

const DevChainalysisPanel = lazy(() => import("@/components/DevChainalysisPanel").then(m => ({ default: m.DevChainalysisPanel })));

interface HeroSectionProps {
  onSubmit: (input: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  scans: RecentScan[];
  bookmarks: Bookmark[];
  onClearScans: () => void;
  onRemoveBookmark: (id: string) => void;
  onClearBookmarks: () => void;
  onExportBookmarks?: () => void;
  onImportBookmarks?: ((json: string) => { imported: number; error?: string }) | undefined;
}

export function HeroSection({
  onSubmit,
  inputRef,
  scans,
  bookmarks,
  onClearScans,
  onRemoveBookmark,
  onClearBookmarks,
  onExportBookmarks,
  onImportBookmarks,
}: HeroSectionProps) {
  const { t } = useTranslation();
  const { devMode } = useDevMode();
  const { proMode } = useExperienceMode();

  return (
    <motion.div
      key="hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center gap-8 text-center w-full"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 120, damping: 20 }}
        className="space-y-3"
      >
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          <span className="text-foreground">{t("page.hero_prefix", { defaultValue: "Am I " })}</span>
          <span className="tracking-wide gradient-text">{t("page.hero_suffix", { defaultValue: "exposed?" })}</span>
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-muted text-lg sm:text-xl max-w-xl mx-auto"
        >
          {t("page.tagline", { defaultValue: "The Bitcoin privacy scanner you were afraid to run." })}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 150, damping: 20 }}
        className="w-full flex justify-center"
      >
        <AddressInput
          onSubmit={onSubmit}
          isLoading={false}
          inputRef={inputRef}
        />
      </motion.div>

      <ScanHistory
        scans={scans}
        bookmarks={proMode ? bookmarks : []}
        examples={EXAMPLES}
        onSelect={onSubmit}
        onClearScans={onClearScans}
        onRemoveBookmark={onRemoveBookmark}
        onClearBookmarks={onClearBookmarks}
        onExportBookmarks={proMode ? onExportBookmarks : undefined}
        onImportBookmarks={proMode ? onImportBookmarks : undefined}
      />

      {devMode && (
        <Suspense fallback={null}>
          <DevChainalysisPanel />
        </Suspense>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-2 rounded-full border border-card-border bg-surface-elevated/30 text-sm text-muted"
      >
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-success/80" />
          {t("page.trust_client", { defaultValue: "100% client-side" })}
        </span>
        <span className="text-card-border">|</span>
        <span className="inline-flex items-center gap-1.5">
          <EyeOff size={14} className="text-info/80" />
          {t("page.trust_tracking", { defaultValue: "No tracking" })}
        </span>
        <span className="text-card-border">|</span>
        <a href="https://github.com/Copexit/am-i-exposed" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
          <Github size={14} className="text-muted/80" />
          {t("page.trust_opensource", { defaultValue: "Open source" })}
        </a>
      </motion.div>

    </motion.div>
  );
}
