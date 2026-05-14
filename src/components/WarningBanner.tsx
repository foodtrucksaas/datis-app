"use client";

import { AlertTriangle } from "lucide-react";

interface WarningBannerProps {
  onClickDetails: () => void;
}

export function WarningBanner({ onClickDetails }: WarningBannerProps) {
  return (
    <button
      onClick={onClickDetails}
      className="flex w-full items-center justify-center gap-2 border-b
        border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-1.5 text-[10px]
        font-mono uppercase tracking-wider
        text-[var(--warning-text)] opacity-80 transition-opacity hover:opacity-100"
    >
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span>Not for operational use</span>
    </button>
  );
}
