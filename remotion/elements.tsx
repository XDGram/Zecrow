import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { C, D, FONT } from "./brand";

/* ========================================================================
   Shared premium building blocks for the Zecrow demo — animated backdrops,
   particles, grain, glass cards, glow shields, coins and kinetic type.
   Everything is frame-deterministic so renders are reproducible.
   ===================================================================== */

/** Slowly drifting multi-blob mesh gradient. Light or dark variant. */
export function MeshBg({ dark = false }: { dark?: boolean }) {
  const f = useCurrentFrame();
  const base = dark ? D.bg : "#ffffff";
  const blobs = dark
    ? [
        { c: "rgba(244,183,40,0.18)", bx: 22, by: 26, r: 46, sp: 0.5 },
        { c: "rgba(99,102,241,0.16)", bx: 78, by: 32, r: 50, sp: 0.7 },
        { c: "rgba(255,255,255,0.05)", bx: 55, by: 78, r: 55, sp: 0.4 },
      ]
    : [
        { c: "rgba(233,162,26,0.16)", bx: 20, by: 24, r: 46, sp: 0.5 },
        { c: "rgba(99,102,241,0.10)", bx: 80, by: 30, r: 48, sp: 0.7 },
        { c: "rgba(16,185,129,0.08)", bx: 60, by: 80, r: 50, sp: 0.4 },
      ];
  return (
    <AbsoluteFill style={{ background: base }}>
      {blobs.map((b, i) => {
        const x = b.bx + Math.sin((f * 0.012 * b.sp) + i) * 6;
        const y = b.by + Math.cos((f * 0.010 * b.sp) + i * 1.7) * 6;
        return (
          <AbsoluteFill
            key={i}
            style={{ background: `radial-gradient(${b.r}% ${b.r}% at ${x}% ${y}%, ${b.c}, transparent 70%)` }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

/** Floating particle field with twinkle + slow drift. */
export function Particles({ count = 48, dark = false, accent = false }: { count?: number; dark?: boolean; accent?: boolean }) {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {new Array(count).fill(0).map((_, i) => {
        const px = random(`px${i}`) * width;
        const py = random(`py${i}`) * height;
        const drift = Math.sin(f * 0.02 + i) * 14;
        const rise = ((f * (0.2 + random(`sp${i}`) * 0.5)) % (height + 40));
        const y = (py - rise + height + 40) % (height + 40);
        const size = 1 + random(`sz${i}`) * 2.6;
        const tw = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(f * 0.08 + i * 2));
        const col = accent || random(`c${i}`) > 0.72 ? (dark ? D.accent : C.accent) : dark ? "rgba(255,255,255,0.8)" : "rgba(10,10,15,0.35)";
        return (
          <div
            key={i}
            style={{ position: "absolute", left: px + drift, top: y, width: size, height: size, borderRadius: "50%", background: col, opacity: tw * (dark ? 0.9 : 0.5), boxShadow: accent ? `0 0 8px ${dark ? D.glow : "rgba(233,162,26,0.5)"}` : "none" }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

/** Subtle static film grain to kill the flat "AI slop" look. */
export function Grain({ opacity = 0.05 }: { opacity?: number }) {
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id="zgrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#zgrain)" />
      </svg>
    </AbsoluteFill>
  );
}

/** Soft radial vignette for depth. */
export function Vignette({ dark = false }: { dark?: boolean }) {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 120% at 50% 50%, transparent 55%, ${dark ? "rgba(0,0,0,0.55)" : "rgba(10,10,15,0.06)"})`, pointerEvents: "none" }} />
  );
}

/** A faint moving dot grid. */
export function DotGrid({ dark = false }: { dark?: boolean }) {
  const f = useCurrentFrame();
  const shift = (f * 0.3) % 44;
  const dot = dark ? "rgba(255,255,255,0.08)" : "rgba(10,10,15,0.06)";
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${dot} 1.4px, transparent 1.4px)`,
        backgroundSize: "44px 44px",
        backgroundPosition: `${shift}px ${shift}px`,
        maskImage: "radial-gradient(70% 70% at 50% 50%, #000, transparent)",
        WebkitMaskImage: "radial-gradient(70% 70% at 50% 50%, #000, transparent)",
      }}
    />
  );
}

export function ZMark({ size = 48, dark = false, glow = false }: { size?: number; dark?: boolean; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ filter: glow ? `drop-shadow(0 0 16px ${dark ? D.glow : "rgba(233,162,26,0.45)"})` : "none" }}>
      <path d="M6 25.2C8.2 18.1 14.2 13.2 21.6 12.6C24.5 9.1 31.5 9.3 35.1 14.2L45.5 18.8L37.4 22.4L34.6 28.3C32.5 34.3 25.8 37 19.3 33.8L11.4 39L12.8 30.9C9.4 29.8 7.1 27.8 6 25.2Z" fill={dark ? "#fff" : C.ink} />
      <path d="M17.3 27.2C20.8 29.7 25.8 30 29.8 28.2" stroke={dark ? C.ink : "#fff"} strokeOpacity="0.72" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="29.2" cy="18.1" r="1.7" fill={C.accent} />
    </svg>
  );
}

export function Wordmark({ size = 34, dark = false, glow = false }: { size?: number; dark?: boolean; glow?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <ZMark size={size * 1.25} dark={dark} glow={glow} />
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: "-0.04em", color: dark ? "#fff" : C.ink }}>Zecrow</span>
    </div>
  );
}

/** Kinetic, word-by-word rise + blur-in typography. */
export function Words({
  text, size, weight = 800, color = C.ink, delay = 0, stagger = 3.5, lineHeight = 1.05, justify = "center", maxWidth,
}: {
  text: string; size: number; weight?: number; color?: string; delay?: number; stagger?: number; lineHeight?: number; justify?: React.CSSProperties["justifyContent"]; maxWidth?: number;
}) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: justify, gap: `0 ${size * 0.26}px`, maxWidth, fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight, letterSpacing: "-0.03em", color, textAlign: "center" }}>
      {text.split(" ").map((w, i) => {
        const s = spring({ frame: f - delay - i * stagger, fps, config: { damping: 200, mass: 0.6 } });
        return (
          <span key={i} style={{ display: "inline-block", opacity: s, transform: `translateY(${(1 - s) * 30}px)`, filter: `blur(${(1 - s) * 9}px)` }}>{w}</span>
        );
      })}
    </div>
  );
}

/** Glassmorphic card (uiverse-style frosted panel with gradient edge + glow). */
export function GlassCard({
  children, dark = false, style, glow = false,
}: { children: React.ReactNode; dark?: boolean; style?: React.CSSProperties; glow?: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        background: dark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${dark ? D.panelBorder : "rgba(255,255,255,0.9)"}`,
        borderRadius: 24,
        boxShadow: dark
          ? `0 30px 70px -30px rgba(0,0,0,0.7)${glow ? `, 0 0 40px -8px ${D.glow}` : ""}`
          : `0 30px 60px -28px rgba(10,10,15,0.25)${glow ? ", 0 0 40px -10px rgba(233,162,26,0.45)" : ""}`,
        ...style,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 24, padding: 1, background: `linear-gradient(140deg, ${dark ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,1)"}, transparent 40%)`, WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude", pointerEvents: "none" }} />
      {children}
    </div>
  );
}

/** Shield with a soft pulsing glow. */
export function GlowShield({ size = 120, dark = false, delay = 0 }: { size?: number; dark?: boolean; delay?: number }) {
  const f = useCurrentFrame();
  const pulse = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin((f - delay) * 0.07));
  const col = dark ? D.accent : C.accent;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ filter: `drop-shadow(0 0 ${18 * pulse}px ${dark ? D.glow : "rgba(233,162,26,0.5)"})` }}>
      <path d="M12 3l7 3v6c0 4.5-3 7.3-7 8.5C8 19.3 5 16.5 5 12V6z" stroke={col} strokeWidth="1.3" strokeLinejoin="round" fill={dark ? "rgba(244,183,40,0.08)" : "rgba(233,162,26,0.06)"} />
      <path d="M9 12l2 2 4-4" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A shielded coin token. */
export function Coin({ size = 54, delay = 0 }: { size?: number; delay?: number }) {
  const f = useCurrentFrame();
  const spin = Math.sin((f - delay) * 0.05);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#ffe6a6,#f4b728 55%,#cf8f12)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px -8px rgba(207,143,18,0.7), inset 0 2px 6px rgba(255,255,255,0.6)", transform: `scaleX(${0.6 + 0.4 * Math.abs(spin)})` }}>
      <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: size * 0.5, color: "#7a5406" }}>ⓩ</span>
    </div>
  );
}

/** Animated shimmer pill. */
export function ShieldPill({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const f = useCurrentFrame();
  const shimmer = interpolate(f % 80, [0, 80], [-130, 230]);
  return (
    <div style={{ position: "relative", overflow: "hidden", display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 24px", borderRadius: 999, background: dark ? "rgba(244,183,40,0.14)" : C.accentWash, border: `1px solid ${dark ? "rgba(244,183,40,0.4)" : C.accentSoft}`, color: dark ? D.accentSoft : C.accentInk, fontFamily: FONT, fontWeight: 600, fontSize: 25, boxShadow: dark ? `0 0 26px -6px ${D.glow}` : "none" }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${shimmer}%`, width: "35%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)" }} />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 4.5-3 7.3-7 8.5C8 19.3 5 16.5 5 12V6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span style={{ position: "relative" }}>{children}</span>
    </div>
  );
}

/** Scene cross-dissolve opacity. */
export function useSceneFade(dur: number, inFrames = 16, outFrames = 24) {
  const frame = useCurrentFrame();
  return interpolate(frame, [0, inFrames, dur - outFrames, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

export function useRise(delay = 0, dist = 28) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.7 } });
  return { opacity: s, transform: `translateY(${(1 - s) * dist}px)` };
}

export { Easing };
