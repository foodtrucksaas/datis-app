"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface DataAccordionProps {
  label: string;
  preview?: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function DataAccordion({
  label,
  preview,
  badge,
  badgeColor = "var(--warm)",
  children,
  defaultOpen = false,
}: DataAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mx-3.5 rounded-[7px] border-[0.5px] border-[var(--border)] bg-[var(--surface)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--surface-elevated)]/50"
      >
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${open ? "" : "-rotate-90"}`}
        />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          {label}
        </span>
        {badge && (
          <span
            className="ml-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: `color-mix(in srgb, ${badgeColor} 15%, transparent)`, color: badgeColor }}
          >
            {badge}
          </span>
        )}
        {preview && !open && (
          <span className="ml-auto truncate text-right font-mono text-[10px] text-[var(--text-muted)]">
            {preview}
          </span>
        )}
      </button>
      {open && <div className="border-t-[0.5px] border-[var(--border)]">{children}</div>}
    </div>
  );
}
