"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { searchAirports } from "@/lib/airports";
import type { Airport } from "@/lib/types";

export function IcaoInput() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (query.length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }
    const found = searchAirports(query);
    setResults(found);
    setOpen(found.length > 0);
    setSelectedIndex(-1);
  }, [query]);

  const navigate = useCallback(
    (icao: string) => {
      setQuery("");
      setOpen(false);
      router.push(`/atis/${icao.toUpperCase()}`);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" && query.length === 4) {
        navigate(query);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          navigate(results[selectedIndex].icao);
        } else if (query.length === 4) {
          navigate(query);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
            if (val.length <= 4) setQuery(val);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onBlur={() => {
            // Delay to allow click on result
            setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Code ICAO (ex. LFPG)"
          maxLength={4}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-xl py-3.5 pl-11 pr-4
            font-mono text-lg tracking-widest placeholder:font-sans
            placeholder:text-sm placeholder:tracking-normal
            focus:outline-none focus:ring-1
            border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-dim)] focus:ring-[var(--accent-dim)]"
        />
        {query.length > 0 && query.length < 4 && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--text-muted)]">
            {query.length}/4
          </span>
        )}
        {query.length === 4 && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--fresh)]">
            ↵
          </span>
        )}
      </div>

      {open && (
        <ul
          ref={listRef}
          className="absolute z-40 mt-1.5 w-full overflow-auto rounded-xl py-1 shadow-2xl max-h-64
            border border-[var(--border)] bg-[var(--surface-elevated)] backdrop-blur-xl"
        >
          {results.map((airport, i) => (
            <li
              key={airport.icao}
              onMouseDown={() => navigate(airport.icao)}
              className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm transition-colors
                ${i === selectedIndex
                  ? "bg-[var(--accent)]/10 text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                }`}
            >
              <span className="shrink-0 font-mono text-sm font-semibold text-[var(--accent)]">
                {airport.icao}
              </span>
              <span className="truncate">
                {airport.name}
              </span>
              <span className="ml-auto shrink-0 text-xs text-[var(--text-muted)]">
                {airport.country}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
