"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------
   Zcash coins rendered as spinning 3D metal in Canvas 2D (no WebGL,
   so it works in sandboxed panes). Each coin turns about its vertical
   axis: the face squashes to an ellipse while a stack of offset discs
   forms the gold cylindrical edge — a real coin-flip look.
------------------------------------------------------------------- */

type Coin = {
  xr: number;   // center x as fraction of viewport width
  yr: number;   // center y as fraction of viewport height
  r: number;    // base radius (px at 1440w)
  speed: number; // spin rad/sec (sign = direction)
  phase: number;
  floatAmp: number;
  floatSpeed: number;
  alpha: number;
};

const COINS: Coin[] = [
  { xr: 0.085, yr: 0.27, r: 96, speed: 0.55, phase: 0.2, floatAmp: 16, floatSpeed: 0.45, alpha: 0.9 },
  { xr: 0.94, yr: 0.52, r: 112, speed: -0.4, phase: 1.7, floatAmp: 20, floatSpeed: 0.38, alpha: 0.82 },
  { xr: 0.12, yr: 0.9, r: 68, speed: 0.72, phase: 3.0, floatAmp: 12, floatSpeed: 0.55, alpha: 0.72 },
];

function ellipsePath(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.4, rx), ry, 0, 0, Math.PI * 2);
}

function drawZ(ctx: CanvasRenderingContext2D, cx: number, cy: number, faceRX: number, r: number) {
  // The $ZEC ticker, squashed horizontally to follow the coin's rotation.
  const sx = Math.max(faceRX / r, 0.0001);
  const font = (px: number) =>
    `800 ${px}px "Geist", system-ui, -apple-system, "Segoe UI", sans-serif`;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sx, 1);
  ctx.fillStyle = "#fffdf4";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font(100);
  const w = ctx.measureText("$ZEC").width || 240;
  ctx.font = font((r * 1.28) / w * 100);
  ctx.fillText("$ZEC", 0, r * 0.02);
  ctx.restore();
}

function drawCoin(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  alpha: number
) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const faceRX = r * Math.abs(c);
  const h = r * 0.16; // half thickness
  const steps = 22;

  ctx.save();
  ctx.globalAlpha = alpha;

  // soft contact shadow
  ctx.save();
  ctx.globalAlpha = alpha * 0.18;
  ctx.filter = "blur(10px)";
  ellipsePath(ctx, cx, cy + r * 0.86, faceRX + h, r * 0.2);
  ctx.fillStyle = "#6b4705";
  ctx.fill();
  ctx.restore();

  // cylindrical edge: stacked discs from far to near
  for (let i = 0; i <= steps; i++) {
    const t = -1 + (2 * i) / steps;
    const ex = cx + t * h * s;
    const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    g.addColorStop(0, "#6e4a06");
    g.addColorStop(0.5, "#f1c75c");
    g.addColorStop(1, "#6e4a06");
    ctx.fillStyle = g;
    ellipsePath(ctx, ex, cy, faceRX, r);
    ctx.fill();
  }

  // near face
  const nearX = cx + h * s;
  if (faceRX > 1.5) {
    const rg = ctx.createRadialGradient(
      nearX - faceRX * 0.32, cy - r * 0.34, r * 0.08,
      nearX, cy, Math.max(faceRX, r)
    );
    rg.addColorStop(0, "#fff0bf");
    rg.addColorStop(0.4, "#f6c445");
    rg.addColorStop(0.78, "#d2920f");
    rg.addColorStop(1, "#9c6c0a");
    ctx.fillStyle = rg;
    ellipsePath(ctx, nearX, cy, faceRX, r);
    ctx.fill();

    // rim ring
    ctx.lineWidth = Math.max(1.4, r * 0.045);
    ctx.strokeStyle = "rgba(255,246,208,0.55)";
    ellipsePath(ctx, nearX, cy, faceRX * 0.9, r * 0.9);
    ctx.stroke();

    // embossed Z (clipped to the face)
    ctx.save();
    ellipsePath(ctx, nearX, cy, faceRX, r);
    ctx.clip();
    drawZ(ctx, nearX, cy, faceRX, r);
    ctx.restore();
  }

  ctx.restore();
}

export default function ZcashBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, dpr = 1, scale = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.min(Math.max(W / 1440, 0.62), 1.2);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let running = true;
    const start = performance.now();

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (const coin of COINS) {
        const r = coin.r * scale;
        const cx = coin.xr * W;
        const cy = coin.yr * H + (reduced ? 0 : Math.sin(t * coin.floatSpeed + coin.phase) * coin.floatAmp);
        const angle = reduced ? -0.45 : coin.phase + t * coin.speed;
        drawCoin(ctx, cx, cy, r, angle, coin.alpha);
      }
      if (running && !reduced) raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running && !reduced && !raf) raf = requestAnimationFrame(frame);
      if (!running && raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    io.observe(canvas);

    if (reduced) frame(start);
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full blur-[7px]"
    />
  );
}
