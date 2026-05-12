"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface RawDataBlockProps {
  raw: string;
}

export function RawDataBlock({ raw }: RawDataBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-md border border-[var(--border)] bg-[var(--mono-bg)]">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-secondary)]"
        aria-label="Copier"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-[var(--fresh)]" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <div className="overflow-x-auto p-3 pr-10">
        <pre className="font-mono text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap break-words">
          {raw}
        </pre>
      </div>
    </div>
  );
}
