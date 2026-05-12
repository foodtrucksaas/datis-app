"use client";

interface RawDecodedToggleProps {
  mode: "raw" | "decoded";
  onToggle: () => void;
}

export function RawDecodedToggle({ mode, onToggle }: RawDecodedToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-dim)] hover:text-[var(--text-primary)]"
    >
      <span className={mode === "raw" ? "text-[var(--accent)]" : ""}>Raw</span>
      <span className="text-[var(--text-muted)]">/</span>
      <span className={mode === "decoded" ? "text-[var(--accent)]" : ""}>Decoded</span>
    </button>
  );
}
