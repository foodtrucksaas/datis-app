"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AIRPORTS } from "@/lib/airports";
import type { Airport } from "@/lib/types";

interface AirportMapProps {
  favorites: string[];
  recents: string[];
}

const DARK_TILES =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILES =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

/** Major airports: ICAO codes starting with common prefixes for big hubs */
const MAJOR_PREFIXES = new Set([
  // We'll use a size heuristic: airports whose name contains "International"
  // or whose ICAO starts with certain patterns are shown at lower zoom levels
]);

function isMajor(a: Airport): boolean {
  const n = a.name.toLowerCase();
  return (
    n.includes("international") ||
    n.includes("intl") ||
    n.includes("charles de gaulle") ||
    n.includes("heathrow") ||
    n.includes("schiphol") ||
    n.includes("frankfurt") ||
    n.includes("barajas") ||
    n.includes("fiumicino") ||
    n.includes("jfk") ||
    n.includes("o'hare") ||
    n.includes("los angeles") ||
    n.includes("dubai") ||
    n.includes("changi") ||
    n.includes("narita") ||
    n.includes("haneda") ||
    n.includes("incheon") ||
    n.includes("istanbul") ||
    n.includes("doha") ||
    n.includes("beijing") ||
    n.includes("pudong") ||
    n.includes("sydney") ||
    n.includes("mumbai") ||
    n.includes("johannesburg")
  );
}

export default function AirportMap({ favorites, recents }: AirportMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  // Filter airports with coordinates
  const airportsWithCoords = useMemo(
    () => AIRPORTS.filter((a) => a.lat != null && a.lon != null),
    []
  );

  const favSet = useMemo(() => new Set(favorites), [favorites]);
  const recentSet = useMemo(() => new Set(recents), [recents]);

  // Detect dark mode
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [48, 10], // Europe center
      zoom: 4,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    leafletMap.current = map;
    markersLayer.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Update tile layer when theme changes
  useEffect(() => {
    if (!leafletMap.current) return;
    const map = leafletMap.current;

    // Remove old tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });

    L.tileLayer(isDark ? DARK_TILES : LIGHT_TILES, {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);
  }, [isDark]);

  // Render markers based on zoom level
  useEffect(() => {
    if (!leafletMap.current || !markersLayer.current) return;
    const map = leafletMap.current;
    const layer = markersLayer.current;

    function renderMarkers() {
      layer.clearLayers();
      const zoom = map.getZoom();
      const bounds = map.getBounds();

      // Zoom-dependent filtering for performance
      let filtered: Airport[];
      if (zoom < 4) {
        // Very zoomed out: only favorites, recents, and major airports
        filtered = airportsWithCoords.filter(
          (a) => favSet.has(a.icao) || recentSet.has(a.icao) || isMajor(a)
        );
      } else if (zoom < 6) {
        // Medium zoom: show airports in view
        filtered = airportsWithCoords.filter(
          (a) =>
            bounds.contains([a.lat!, a.lon!]) ||
            favSet.has(a.icao) ||
            recentSet.has(a.icao)
        );
      } else {
        // Zoomed in: show all in view
        filtered = airportsWithCoords.filter((a) =>
          bounds.contains([a.lat!, a.lon!])
        );
      }

      for (const airport of filtered) {
        const isFav = favSet.has(airport.icao);
        const isRecent = recentSet.has(airport.icao);

        let color: string;
        let radius: number;
        let fillOpacity: number;

        if (isFav) {
          color = isDark ? "#FBBF24" : "#D97706"; // warm/gold
          radius = zoom < 6 ? 5 : 6;
          fillOpacity = 0.9;
        } else if (isRecent) {
          color = isDark ? "#38BDF8" : "#0284C7"; // accent
          radius = zoom < 6 ? 4 : 5;
          fillOpacity = 0.8;
        } else {
          color = isDark ? "#5A6675" : "#94A3B8"; // muted
          radius = zoom < 6 ? 2.5 : 3.5;
          fillOpacity = 0.6;
        }

        const marker = L.circleMarker([airport.lat!, airport.lon!], {
          radius,
          color: "transparent",
          fillColor: color,
          fillOpacity,
          interactive: true,
        });

        // Tooltip
        marker.bindTooltip(
          `<div style="font-family:monospace;font-size:12px;font-weight:700;letter-spacing:0.05em">${airport.icao}</div><div style="font-size:11px;opacity:0.8">${airport.name}</div>`,
          {
            direction: "top",
            offset: [0, -8],
            className: "airport-tooltip",
          }
        );

        marker.on("click", () => {
          router.push(`/atis/${airport.icao}`);
        });

        marker.addTo(layer);
      }
    }

    renderMarkers();
    map.on("zoomend moveend", renderMarkers);

    return () => {
      map.off("zoomend moveend", renderMarkers);
    };
  }, [airportsWithCoords, favSet, recentSet, isDark, router]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[var(--border)]">
      <div ref={mapRef} className="h-[50vh] min-h-[300px] w-full" />
      {/* Legend */}
      <div className="absolute bottom-10 left-3 z-[1000] flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 px-2.5 py-2 text-[10px] backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--warm)]" />
          <span className="text-[var(--text-muted)]">Favoris</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
          <span className="text-[var(--text-muted)]">Récents</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)]">Aéroports</span>
        </div>
      </div>
    </div>
  );
}
