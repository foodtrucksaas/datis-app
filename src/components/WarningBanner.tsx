"use client";

import { AlertTriangle } from "lucide-react";

interface WarningBannerProps {
  onClickDetails: () => void;
}

export function WarningBanner({ onClickDetails }: WarningBannerProps) {
  return (
    <button
      onClick={onClickDetails}
      className="sticky top-0 z-30 flex w-full items-center justify-center gap-2 border-b
        border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-1.5 text-[11px]
        text-[var(--warning-text)] opacity-80 transition-opacity hover:opacity-100"
    >
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span>
        Données non officielles · ne pas utiliser en cadre opérationnel
      </span>
    </button>
  );
}
