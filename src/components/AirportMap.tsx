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

/** Compute the subsolar point (where the sun is directly overhead) */
function getSunLatLng(): { lat: number; lng: number } {
  const now = new Date();
  const start = new Date(now.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const declination =
    -23.45 * Math.cos(((360 / 365) * (dayOfYear + 10) * Math.PI) / 180);
  const hourAngle =
    ((now.getUTCHours() + now.getUTCMinutes() / 60) / 24) * 360 - 180;
  return { lat: declination, lng: -hourAngle };
}

/** Convert lat/lng to 3D unit vector */
function latLngToVec3(lat: number, lng: number) {
  const phi = (lat * Math.PI) / 180;
  const theta = ((lng - 90) * Math.PI) / 180;
  return {
    x: Math.cos(phi) * Math.cos(theta),
    y: Math.sin(phi),
    z: -Math.cos(phi) * Math.sin(theta),
  };
}

// High-res NASA textures
const DAY_TEXTURE =
  "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg";
const NIGHT_TEXTURE =
  "https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg";
const BUMP_TEXTURE =
  "//unpkg.com/three-globe/example/img/earth-topology.png";
const SKY_TEXTURE =
  "//unpkg.com/three-globe/example/img/night-sky.png";

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

    Promise.all([import("globe.gl"), import("three")]).then(
      ([GlobeMod, THREE]) => {
        if (destroyed || !containerRef.current) return;

        const Globe = GlobeMod.default;

        // Create custom material with day + night (emissive) textures
        const loader = new THREE.TextureLoader();
        const globeMaterial = new THREE.MeshPhongMaterial();

        loader.load(DAY_TEXTURE, (tex) => {
          globeMaterial.map = tex;
          globeMaterial.needsUpdate = true;
        });
        loader.load(NIGHT_TEXTURE, (tex) => {
          globeMaterial.emissiveMap = tex;
          globeMaterial.emissive = new THREE.Color(0xffcc88);
          globeMaterial.emissiveIntensity = 2.5;
          globeMaterial.needsUpdate = true;
        });
        loader.load(BUMP_TEXTURE, (tex) => {
          globeMaterial.bumpMap = tex;
          globeMaterial.bumpScale = 5;
          globeMaterial.needsUpdate = true;
        });

        const globe = new Globe(containerRef.current)
          .globeImageUrl(DAY_TEXTURE)
          .bumpImageUrl(BUMP_TEXTURE)
          .backgroundImageUrl(SKY_TEXTURE)
          .showAtmosphere(true)
          .atmosphereColor("#4da6ff")
          .atmosphereAltitude(0.18)
          .pointOfView({ lat: 46, lng: 6, altitude: 1.8 }, 0)
          .globeMaterial(globeMaterial)
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

        // Set up sun-based directional lighting for day/night
        const scene = globe.scene();
        // Remove default lights
        const defaultLights = scene.children.filter(
          (c: { type: string }) => c.type === "DirectionalLight" || c.type === "AmbientLight"
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        defaultLights.forEach((l: any) => scene.remove(l));

        // Dim ambient (so night side isn't totally black — city lights glow)
        const ambient = new THREE.AmbientLight(0x222244, 0.4);
        scene.add(ambient);

        // Sun directional light
        const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
        const sun = getSunLatLng();
        const sunVec = latLngToVec3(sun.lat, sun.lng);
        sunLight.position.set(sunVec.x * 200, sunVec.y * 200, sunVec.z * 200);
        scene.add(sunLight);

        // Responsive sizing
        function resize() {
          if (!containerRef.current || destroyed) return;
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          globe.width(w).height(h);
        }
        resize();
        window.addEventListener("resize", resize);

        // No auto-rotation — static globe
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
      }
    );

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
