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
      </div>
      <button
        onClick={toggleFav}
        aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
        className="mt-1 p-1.5 transition-colors"
      >
        <Star
          className={`h-5 w-5 ${
            fav
              ? "fill-[var(--warm)] text-[var(--warm)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        />
      </button>
    </div>
  );
}
