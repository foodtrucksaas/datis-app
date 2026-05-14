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

// Satellite imagery (ESRI World Imagery — free with attribution)
const SATELLITE_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

// Labels overlay on top of satellite
const LABELS_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

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
  const [ready, setReady] = useState(false);

  const airportsWithCoords = useMemo(
    () => AIRPORTS.filter((a) => a.lat != null && a.lon != null),
    []
  );

  const favSet = useMemo(() => new Set(favorites), [favorites]);
  const recentSet = useMemo(() => new Set(recents), [recents]);

  // Init map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [46, 6],
      zoom: 5,
      minZoom: 3,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Satellite base layer
    L.tileLayer(SATELLITE_TILES, {
      maxZoom: 18,
    }).addTo(map);

    // Labels on top
    L.tileLayer(LABELS_TILES, {
      maxZoom: 18,
    }).addTo(map);

    // Attribution (required by ESRI)
    L.control
      .attribution({ position: "bottomleft", prefix: false })
      .addAttribution("Esri, Maxar, Earthstar Geographics")
      .addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    leafletMap.current = map;
    markersLayer.current = L.layerGroup().addTo(map);
    setReady(true);

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Render markers based on zoom level
  useEffect(() => {
    if (!ready || !leafletMap.current || !markersLayer.current) return;
    const map = leafletMap.current;
    const layer = markersLayer.current;

    function renderMarkers() {
      layer.clearLayers();
      const zoom = map.getZoom();
      const bounds = map.getBounds();

      let filtered: Airport[];
      if (zoom < 4) {
        filtered = airportsWithCoords.filter(
          (a) => favSet.has(a.icao) || recentSet.has(a.icao) || isMajor(a)
        );
      } else if (zoom < 6) {
        filtered = airportsWithCoords.filter(
          (a) =>
            bounds.contains([a.lat!, a.lon!]) ||
            favSet.has(a.icao) ||
            recentSet.has(a.icao)
        );
      } else {
        filtered = airportsWithCoords.filter((a) =>
          bounds.contains([a.lat!, a.lon!])
        );
      }

      for (const airport of filtered) {
        const isFav = favSet.has(airport.icao);
        const isRecent = recentSet.has(airport.icao);

        let fillColor: string;
        let strokeColor: string;
        let radius: number;
        let weight: number;

        if (isFav) {
          fillColor = "#FBBF24";
          strokeColor = "#92400E";
          radius = zoom < 6 ? 5 : 7;
          weight = 2;
        } else if (isRecent) {
          fillColor = "#38BDF8";
          strokeColor = "#0369A1";
          radius = zoom < 6 ? 4 : 6;
          weight = 1.5;
        } else {
          fillColor = "#FFFFFF";
          strokeColor = "rgba(0,0,0,0.4)";
          radius = zoom < 6 ? 2.5 : 4;
          weight = 1;
        }

        const marker = L.circleMarker([airport.lat!, airport.lon!], {
          radius,
          color: strokeColor,
          weight,
          fillColor,
          fillOpacity: 0.9,
          interactive: true,
        });

        marker.bindTooltip(
          `<span style="font-family:ui-monospace,monospace;font-size:13px;font-weight:800;letter-spacing:0.06em;color:#0284C7">${airport.icao}</span><br/><span style="font-size:11px;color:#475569">${airport.name}</span>`,
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
  }, [ready, airportsWithCoords, favSet, recentSet, router]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[var(--border)] shadow-lg">
      <div ref={mapRef} className="h-[55vh] min-h-[350px] w-full" />
      {/* Legend */}
      <div className="absolute bottom-10 left-3 z-[1000] flex flex-col gap-1.5 rounded-lg bg-black/60 px-3 py-2.5 text-[10px] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-amber-800 bg-amber-400" />
          <span className="text-white/80">Favoris</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-sky-700 bg-sky-400" />
          <span className="text-white/80">Récents</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full border border-black/30 bg-white" />
          <span className="text-white/80">Aéroports</span>
        </div>
      </div>
    </div>
  );
}
