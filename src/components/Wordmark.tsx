interface WordmarkProps {
  size?: "lg" | "md" | "sm";
}

const sizes = {
  lg: {
    atis: "text-[56px] leading-none",
    dot: "text-[56px] leading-none px-[3px]",
    live: "text-[56px] leading-none",
  },
  md: {
    atis: "text-[22px] leading-none",
    dot: "text-[22px] leading-none px-[2px]",
    live: "text-[22px] leading-none",
  },
  sm: {
    atis: "text-[14px] leading-none",
    dot: "text-[14px] leading-none px-[1px]",
    live: "text-[14px] leading-none",
  },
};

export function Wordmark({ size = "md" }: WordmarkProps) {
  const s = sizes[size];

  return (
    <span className="inline-flex items-baseline font-mono select-none">
      <span
        className={`${s.atis} font-medium text-[var(--text-primary)] tracking-[-0.02em]`}
      >
        ATIS
      </span>
      <span
        className={`${s.dot} font-medium text-[var(--accent)] animate-signal-pulse`}
      >
        .
      </span>
      <span
        className={`${s.live} font-normal text-[var(--text-secondary)] tracking-[-0.01em]`}
      >
        live
      </span>
    </span>
  );
}
