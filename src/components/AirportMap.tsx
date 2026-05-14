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
  size: number;
  color: string;
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
      .map((a) => {
        const isFav = favSet.has(a.icao);
        const isRecent = recentSet.has(a.icao);
        return {
          lat: a.lat!,
          lng: a.lon!,
          icao: a.icao,
          name: a.name,
          size: isFav ? 0.4 : isRecent ? 0.3 : 0.12,
          color: isFav ? "#FBBF24" : isRecent ? "#38BDF8" : "rgba(255,255,255,0.45)",
        };
      });
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
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(true)
        .atmosphereColor("#3a7bd5")
        .atmosphereAltitude(0.15)
        .pointOfView({ lat: 46, lng: 6, altitude: 2.2 }, 0)
        // Flat merged points — single GPU draw call
        .pointsData(points)
        .pointLat("lat")
        .pointLng("lng")
        .pointAltitude(0)
        .pointRadius("size")
        .pointColor("color")
        .pointResolution(4)
        .pointLabel((d: object) => {
          const p = d as GlobePoint;
          return `<div style="font-family:ui-monospace,monospace;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1)">
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

      const renderer = globe.renderer();
      renderer.setClearColor(0x000000, 0);

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
    />
  );
}
