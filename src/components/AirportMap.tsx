"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AIRPORTS } from "@/lib/airports";

interface AirportMapProps {
  favorites: string[];
  recents: string[];
}

interface GlobePoint {
  lat: number;
  lng: number;
  icao: string;
  name: string;
  kind: "fav" | "recent" | "normal";
}

export default function AirportMap({ favorites, recents }: AirportMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const router = useRouter();

  const favSet = useMemo(() => new Set(favorites), [favorites]);
  const recentSet = useMemo(() => new Set(recents), [recents]);

  const points: GlobePoint[] = useMemo(() => {
    return AIRPORTS
      .filter((a) => a.lat != null && a.lon != null)
      .map((a) => ({
        lat: a.lat!,
        lng: a.lon!,
        icao: a.icao,
        name: a.name,
        kind: favSet.has(a.icao) ? "fav" : recentSet.has(a.icao) ? "recent" : "normal",
      }));
  }, [favSet, recentSet]);

  const handleClick = useCallback(
    (point: object) => {
      const p = point as GlobePoint;
      router.push(`/atis/${p.icao}`);
    },
    [router]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    import("globe.gl").then((GlobeMod) => {
      if (destroyed || !containerRef.current) return;

      const Globe = GlobeMod.default;
      const globe = new Globe(containerRef.current)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .showAtmosphere(true)
        .atmosphereColor("#3a8fd6")
        .atmosphereAltitude(0.2)
        .pointOfView({ lat: 46, lng: 6, altitude: 1.8 }, 0)
        // Points
        .pointsData(points)
        .pointLat("lat")
        .pointLng("lng")
        .pointAltitude((d: object) => {
          const p = d as GlobePoint;
          return p.kind === "fav" ? 0.04 : p.kind === "recent" ? 0.025 : 0.008;
        })
        .pointRadius((d: object) => {
          const p = d as GlobePoint;
          return p.kind === "fav" ? 0.35 : p.kind === "recent" ? 0.25 : 0.12;
        })
        .pointColor((d: object) => {
          const p = d as GlobePoint;
          if (p.kind === "fav") return "#FBBF24";
          if (p.kind === "recent") return "#38BDF8";
          return "rgba(255, 255, 255, 0.6)";
        })
        .pointLabel((d: object) => {
          const p = d as GlobePoint;
          return `<div style="font-family:ui-monospace,monospace;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1)">
            <div style="font-size:14px;font-weight:800;letter-spacing:0.06em;color:#38BDF8">${p.icao}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:2px">${p.name}</div>
          </div>`;
        })
        .onPointClick(handleClick);

      // Responsive sizing
      function resize() {
        if (!containerRef.current || destroyed) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        globe.width(w).height(h);
      }
      resize();
      window.addEventListener("resize", resize);

      // Slow auto-rotation
      const controls = globe.controls() as { autoRotate: boolean; autoRotateSpeed: number; enableZoom: boolean; minDistance: number; maxDistance: number };
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controls.enableZoom = true;
      controls.minDistance = 120;
      controls.maxDistance = 800;

      globeRef.current = globe;

      return () => {
        window.removeEventListener("resize", resize);
      };
    });

    return () => {
      destroyed = true;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      globeRef.current = null;
    };
  }, [points, handleClick]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[var(--border)]">
      <div
        ref={containerRef}
        className="h-[60vh] min-h-[400px] w-full cursor-grab active:cursor-grabbing"
        style={{ background: "#000010" }}
      />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 rounded-lg bg-black/50 px-3 py-2.5 text-[10px] backdrop-blur-md border border-white/10">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#FBBF24]" />
          <span className="text-white/70">Favoris</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38BDF8]" />
          <span className="text-white/70">Récents</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/60" />
          <span className="text-white/70">Aéroports</span>
        </div>
      </div>
    </div>
  );
}
