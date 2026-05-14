"use client";

import { Star } from "lucide-react";
import { useState, useEffect } from "react";
import { isFavorite, addFavorite, removeFavorite } from "@/lib/store";
import type { Airport } from "@/lib/types";

interface AirportHeaderProps {
  airport: Airport;
}

export function AirportHeader({ airport }: AirportHeaderProps) {
  const [fav, setFav] = useState(false);
  const [justToggled, setJustToggled] = useState(false);

  useEffect(() => {
    setFav(isFavorite(airport.icao));
  }, [airport.icao]);

  const toggleFav = () => {
    if (fav) {
      removeFavorite(airport.icao);
      setFav(false);
    } else {
      addFavorite(airport.icao);
      setFav(true);
    }
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 300);
  };

  return (
    <div className="flex items-start justify-between px-5 py-4">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-wider text-[var(--text-primary)]">
          {airport.icao}
        </h1>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          {airport.name}
        </p>
        {airport.lat != null && airport.lon != null && (
          <p className="mt-0.5 text-[10px] font-mono text-[var(--text-muted)]">
            {airport.lat.toFixed(2)}° / {airport.lon.toFixed(2)}°
          </p>
        )}
      </div>
      <button
        onClick={toggleFav}
        aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
        className="mt-1 rounded-md p-2.5 transition-all active:scale-90"
      >
        <Star
          className={`h-5 w-5 transition-all duration-200 ${
            fav
              ? "fill-[var(--warm)] text-[var(--warm)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          } ${justToggled ? "scale-125" : ""}`}
        />
      </button>
    </div>
  );
}
