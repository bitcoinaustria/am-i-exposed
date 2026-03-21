"use client";

import { memo } from "react";
import type { LucideIcon } from "lucide-react";

interface HistoryTabProps {
  id: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  panelId: string;
  count?: number;
  onClick: () => void;
}

export const HistoryTab = memo(function HistoryTab({
  id,
  label,
  icon: Icon,
  isActive,
  panelId,
  count,
  onClick,
}: HistoryTabProps) {
  return (
    <button
      id={id}
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer pb-1 ${
        isActive
          ? "text-foreground border-b border-foreground"
          : "text-muted hover:text-foreground"
      }`}
    >
      <Icon size={14} aria-hidden="true" />
      {label}
      {count != null && count > 0 && (
        <span className="text-muted">({count})</span>
      )}
    </button>
  );
});
