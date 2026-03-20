"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Download, Upload } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";

export function WorkspaceSettingsPanel() {
  const { t } = useTranslation();
  const { bookmarks, exportBookmarks, importBookmarks } = useBookmarks();
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleExport = useCallback(() => {
    if (bookmarks.length === 0) {
      showToast("error", t("workspace.noBookmarks", { defaultValue: "No saved scans to export." }));
      return;
    }
    exportBookmarks();
    showToast("success", t("workspace.exported", { count: bookmarks.length, defaultValue: "Exported {{count}} scans." }));
  }, [bookmarks, exportBookmarks, showToast, t]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const json = reader.result as string;
      // Support envelope format: { version: 1, bookmarks: [...] }
      let importJson = json;
      try {
        const parsed = JSON.parse(json);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.bookmarks)) {
          importJson = JSON.stringify(parsed.bookmarks);
        }
      } catch { /* fall through to importBookmarks which handles errors */ }

      const result = importBookmarks(importJson);
      if (result.error) {
        showToast("error", t("workspace.importError", { defaultValue: "Import failed. Invalid file format." }));
      } else {
        showToast("success", t("workspace.imported", { count: result.imported, defaultValue: "Imported {{count}} scans." }));
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-imported
    e.target.value = "";
  }, [importBookmarks, showToast, t]);

  return (
    <div className="border-t border-card-border pt-3 space-y-2">
      <p className="text-xs font-medium text-muted">
        {t("workspace.title", { defaultValue: "Workspace" })}
      </p>
      <p className="text-[11px] text-muted/70">
        {t("workspace.scanCount", { count: bookmarks.length, defaultValue: "{{count}} saved scans" })}
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] text-muted hover:text-foreground py-1.5 rounded-lg border border-card-border hover:border-muted/50 transition-colors cursor-pointer"
        >
          <Download size={12} />
          {t("workspace.export", { defaultValue: "Export" })}
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] text-muted hover:text-foreground py-1.5 rounded-lg border border-card-border hover:border-muted/50 transition-colors cursor-pointer"
        >
          <Upload size={12} />
          {t("workspace.import", { defaultValue: "Import" })}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
      {toast && (
        <p className={`text-[11px] ${toast.type === "success" ? "text-severity-good" : "text-severity-critical"}`}>
          {toast.message}
        </p>
      )}
    </div>
  );
}
