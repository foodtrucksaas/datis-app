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
        .atmosphereColor("#4da6ff")
        .atmosphereAltitude(0.18)
        .pointOfView({ lat: 46, lng: 6, altitude: 2.2 }, 0)
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

      // No auto-rotation
      const controls = globe.controls() as {
        autoRotate: boolean;
        enableZoom: boolean;
        minDistance: number;
        maxDistance: number;
        enableDamping: boolean;
        dampingFactor: number;
      };
      controls.autoRotate = false;
      controls.enableZoom = true;
      controls.minDistance = 120;
      controls.maxDistance = 800;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;

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
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ background: "#000010" }}
    />
  );
}
