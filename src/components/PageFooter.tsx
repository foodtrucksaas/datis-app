import Link from "next/link";
import { RefreshCw } from "lucide-react";

interface PageFooterProps {
  onRefresh: () => void;
}

export function PageFooter({ onRefresh }: PageFooterProps) {
  return (
    <footer className="mt-8 border-t border-[var(--border)] px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5 text-[10px] font-mono leading-relaxed text-[var(--text-muted)]">
          <p>Source : ACARS via airframes.io</p>
          <p>Not for operational use</p>
        </div>
        <button
          onClick={onRefresh}
          className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[var(--text-muted)] transition-colors hover:border-[var(--accent-dim)] hover:text-[var(--accent)] active:scale-95"
          aria-label="Actualiser"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 text-center">
        <Link
          href="/legal"
          className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Mentions légales
        </Link>
      </div>
    </footer>
  );
}
