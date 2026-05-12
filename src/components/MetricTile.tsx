interface MetricTileProps {
  label: string;
  value: string;
  /** Optional color override for the value text */
  valueColor?: string;
}

export function MetricTile({ label, value, valueColor }: MetricTileProps) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
      <p
        className="mt-1 font-mono text-base font-semibold leading-tight"
        style={{ color: valueColor ?? "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}
