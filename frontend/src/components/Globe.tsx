import { useEffect, useRef, useCallback } from "react";
import createGlobe from "cobe";

interface GlobeProps {
  className?: string;
}

// Long-distance pairs — every server is on continental land, no ocean/islands
const serverPairs = [
  // ── Transatlantic & Europe ↔ Americas ──
  { a: [48.8566, 2.3522], b: [-23.5505, -46.6333] },   // Paris ↔ São Paulo
  { a: [51.5074, -0.1278], b: [40.7128, -74.006] },     // London ↔ New York
  { a: [52.3676, 4.9041], b: [35.6762, 139.6503] },     // Amsterdam ↔ Tokyo
  { a: [52.52, 13.405], b: [-34.6037, -58.3816] },      // Berlin ↔ Buenos Aires
  { a: [50.1109, 8.6821], b: [3.139, 101.6869] },       // Frankfurt ↔ Kuala Lumpur
  { a: [47.3769, 8.5417], b: [19.076, 72.8777] },       // Zurich ↔ Mumbai
  { a: [59.3293, 18.0686], b: [37.7749, -122.4194] },   // Stockholm ↔ San Francisco
  { a: [60.1699, 24.9384], b: [37.5665, 126.978] },     // Helsinki ↔ Seoul
  { a: [40.4168, -3.7038], b: [19.4326, -99.1332] },    // Madrid ↔ Mexico City
  { a: [38.7223, -9.1393], b: [42.3601, -71.0589] },    // Lisbon ↔ Boston
  // ── Europe ↔ Middle East / Asia ──
  { a: [41.9028, 12.4964], b: [25.2048, 55.2708] },     // Rome ↔ Dubai
  { a: [48.2082, 16.3738], b: [31.2304, 121.4737] },    // Vienna ↔ Shanghai
  { a: [55.6761, 12.5683], b: [41.8781, -87.6298] },    // Copenhagen ↔ Chicago
  { a: [52.2297, 21.0122], b: [28.7041, 77.1025] },     // Warsaw ↔ Delhi
  { a: [53.3498, -6.2603], b: [43.6532, -79.3832] },    // Dublin ↔ Toronto
  { a: [55.9533, -3.1883], b: [4.711, -74.0721] },      // Edinburgh ↔ Bogotá
  { a: [59.9139, 10.7522], b: [61.2181, -149.9003] },   // Oslo ↔ Anchorage
  { a: [44.4268, 26.1025], b: [39.9042, 116.4074] },    // Bucharest ↔ Beijing
  { a: [37.9838, 23.7275], b: [-26.2041, 28.0473] },    // Athens ↔ Johannesburg
  { a: [41.0082, 28.9784], b: [22.3193, 114.1694] },    // Istanbul ↔ Hong Kong
  // ── Americas ↔ Asia / Africa / Oceania ──
  { a: [47.6062, -122.3321], b: [-33.8688, 151.2093] }, // Seattle ↔ Sydney
  { a: [33.749, -84.388], b: [33.5731, -7.5898] },      // Atlanta ↔ Casablanca
  { a: [25.7617, -80.1918], b: [-12.0464, -77.0428] },  // Miami ↔ Lima
  { a: [29.7604, -95.3698], b: [6.5244, 3.3792] },      // Houston ↔ Lagos
  { a: [32.7767, -96.797], b: [10.4806, -66.9036] },    // Dallas ↔ Caracas
  { a: [39.7392, -104.9903], b: [9.0192, 38.7525] },    // Denver ↔ Addis Ababa
  { a: [33.4484, -112.074], b: [-0.1807, -78.4678] },   // Phoenix ↔ Quito
  { a: [49.2827, -123.1207], b: [-37.8136, 144.9631] }, // Vancouver ↔ Melbourne
  { a: [45.5152, -122.6784], b: [25.033, 121.5654] },   // Portland ↔ Taipei
  { a: [25.6866, -100.3161], b: [-33.4489, -70.6693] }, // Monterrey ↔ Santiago
  // ── Asia ↔ Africa / Oceania ──
  { a: [-6.2088, 106.8456], b: [-1.2921, 36.8219] },    // Jakarta ↔ Nairobi
  { a: [1.3521, 103.8198], b: [-33.9249, 18.4241] },    // Singapore ↔ Cape Town
  { a: [14.5995, 120.9842], b: [-27.4698, 153.0251] },  // Manila ↔ Brisbane
  { a: [10.8231, 106.6297], b: [-6.7924, 39.2083] },    // Ho Chi Minh ↔ Dar es Salaam
  { a: [13.7563, 100.5018], b: [24.8607, 67.0011] },    // Bangkok ↔ Karachi
  // ── Central Asia / Middle East ↔ Africa ──
  { a: [43.2551, 76.9126], b: [5.6037, -0.187] },       // Almaty ↔ Accra
  { a: [41.2995, 69.2401], b: [36.8065, 10.1815] },     // Tashkent ↔ Tunis
  { a: [24.7136, 46.6753], b: [43.1332, 131.9113] },    // Riyadh ↔ Vladivostok
  { a: [32.0853, 34.7818], b: [-34.9011, -56.1645] },   // Tel Aviv ↔ Montevideo
  { a: [30.0444, 31.2357], b: [55.0084, 82.9357] },     // Cairo ↔ Novosibirsk
];

// Derive flat arrays
const servers = serverPairs.flatMap((p) => [
  { location: p.a, size: 0.05 },
  { location: p.b, size: 0.05 },
]);

const arcs = serverPairs.map((p) => ({
  start: p.a,
  end: p.b,
}));

// Convert lat/lon → unit sphere XYZ
function latLonToXYZ(lat: number, lon: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ];
}

// 3D → 2D projection
function project(
  x: number,
  y: number,
  z: number,
  phi: number,
  theta: number,
  size: number
): { x: number; y: number; visible: boolean } {
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  const rx = x * cosP + z * sinP;
  const rz = -x * sinP + z * cosP;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const ry = y * cosT - rz * sinT;
  const rz2 = y * sinT + rz * cosT;
  return {
    x: size / 2 + rx * size * 0.45,
    y: size / 2 - ry * size * 0.45,
    visible: rz2 > -0.2,
  };
}

const ARC_DELAY = 1.2;   // seconds between each arc appearing
const ARC_TRACE = 0.8;   // seconds for the trace to travel start → end

const Globe = ({ className = "" }: GlobeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(0);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());

  const drawOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const phi = phiRef.current;
    const theta = 0.2;
    const size = Math.min(w, h);
    const offsetX = (w - size) / 2;
    const offsetY = (h - size) / 2;

    const elapsed = (Date.now() - startTimeRef.current) / 1000;

    // ── Animated arcs ──
    arcs.forEach((arc, i) => {
      const t = elapsed - i * ARC_DELAY;
      if (t < 0) return; // not started yet

      const progress = Math.min(1, t / ARC_TRACE); // 0 → 1

      const [x1, y1, z1] = latLonToXYZ(arc.start[0], arc.start[1]);
      const [x2, y2, z2] = latLonToXYZ(arc.end[0], arc.end[1]);
      const p1 = project(x1, y1, z1, phi, theta, size);
      const p2 = project(x2, y2, z2, phi, theta, size);

      if (!p1.visible && !p2.visible) return;

      // Lift proportional to distance but very close to surface
      const dot = x1 * x2 + y1 * y2 + z1 * z2;
      const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
      const maxLift = 0.005 + angle * 0.008;

      const steps = 32;
      const stepsToShow = Math.ceil(progress * steps);

      ctx.beginPath();
      let started = false;
      let headX = 0;
      let headY = 0;
      let headVisible = false;

      for (let s = 0; s <= stepsToShow; s++) {
        const st = s / steps;
        const ix = x1 * (1 - st) + x2 * st;
        const iy = y1 * (1 - st) + y2 * st;
        const iz = z1 * (1 - st) + z2 * st;
        const len = Math.sqrt(ix * ix + iy * iy + iz * iz);
        const lift = 1 + maxLift * Math.sin(st * Math.PI);
        const nx = (ix / len) * lift;
        const ny = (iy / len) * lift;
        const nz = (iz / len) * lift;
        const p = project(nx, ny, nz, phi, theta, size);

        if (!p.visible) {
          started = false;
          continue;
        }

        const px = p.x + offsetX;
        const py = p.y + offsetY;

        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }

        headX = px;
        headY = py;
        headVisible = true;
      }

      const alpha = p1.visible && p2.visible ? 0.5 : 0.2;
      ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Bright traveling dot at the trace front
      if (progress < 1 && headVisible) {
        ctx.beginPath();
        ctx.arc(headX, headY, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(headX, headY, 7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34, 197, 94, 0.15)";
        ctx.fill();
      }
    });

    // ── Server pixels (always visible) ──
    servers.forEach((s) => {
      const [x, y, z] = latLonToXYZ(s.location[0], s.location[1]);
      const p = project(x, y, z, phi, theta, size);
      if (!p.visible) return;

      const px = p.x + offsetX;
      const py = p.y + offsetY;
      const dotSize = 3;

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
      ctx.fill();

      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(px - dotSize / 2, py - dotSize / 2, dotSize, dotSize);
    });

    phiRef.current += 0.003;
    animRef.current = requestAnimationFrame(drawOverlay);
  }, []);

  useEffect(() => {
    let width = 0;

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
      if (overlayRef.current) {
        overlayRef.current.width = width * 2;
        overlayRef.current.height = width * 2;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.2,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 20000,
      mapBrightness: 6,
      baseColor: [0.95, 0.95, 0.95],
      markerColor: [0.23, 0.51, 0.96],
      glowColor: [0.85, 0.9, 0.85],
      markers: [],
      onRender: (state) => {
        state.phi = phiRef.current;
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    animRef.current = requestAnimationFrame(drawOverlay);

    return () => {
      globe.destroy();
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [drawOverlay]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          aspectRatio: "1",
        }}
      />
      <canvas
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          aspectRatio: "1",
        }}
      />
    </div>
  );
};

export default Globe;
