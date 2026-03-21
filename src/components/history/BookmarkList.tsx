"use client";

import { memo } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { gradeColor, truncateId } from "@/lib/constants";
import type { Bookmark } from "@/hooks/useBookmarks";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onSelect: (input: string) => void;
  onRemoveBookmark: (input: string) => void;
}

export const BookmarkList = memo(function BookmarkList({
  bookmarks,
  onSelect,
  onRemoveBookmark,
}: BookmarkListProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      {bookmarks.map((bm) => (
        <div
          key={bm.input}
          className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-elevated/50
            border border-card-border hover:border-card-border hover:bg-surface-elevated
            transition-all text-xs group"
        >
          <button
            onClick={() => onSelect(bm.input)}
            className="inline-flex items-center gap-2 cursor-pointer"
          >
            <span className={`font-bold ${gradeColor(bm.grade)}`}>
              {bm.grade}
            </span>
            {bm.label ? (
              <span className="text-foreground truncate max-w-32">{bm.label}</span>
            ) : (
              <span className="font-mono text-muted group-hover:text-foreground transition-colors truncate max-w-32">
                {truncateId(bm.input)}
              </span>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveBookmark(bm.input);
            }}
            className="text-muted hover:text-foreground transition-colors cursor-pointer p-2 -mr-2"
            title={t("history.remove", { defaultValue: "Remove bookmark" })}
            aria-label={t("history.remove", { defaultValue: "Remove bookmark" })}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
});
