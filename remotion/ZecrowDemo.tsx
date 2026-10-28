import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { C, D, FONT } from "./brand";
import {
  MeshBg, Particles, Grain, Vignette, DotGrid, Wordmark, ZMark, Words, GlassCard, GlowShield, Coin, ShieldPill, useSceneFade, useRise, Easing,
} from "./elements";

// Voiceover is split into one clip per scene; each scene is timed to its clip and plays it after a
// short lead-in. A self-synthesized ambient bed (public/music.mp3) sits low under the narration.
const AUDIO = true;

/* ===================== SCENE 1 · HOOK (light) ===================== */
function Hook({ dur }: { dur: number }) {
  const frame = useCurrentFrame();
  const kicker = useRise(0);
  const underline = interpolate(frame, [36, 72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const shieldY = interpolate(frame, [0, dur], [10, -24]);
  const out = useSceneFade(dur);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <MeshBg />
      <DotGrid />
      <Particles count={40} accent />
      <div style={{ position: "absolute", top: "26%", opacity: 0.5, transform: `translateY(${shieldY}px) scale(2.4)` }}><GlowShield size={120} /></div>
      <div style={{ ...kicker, marginBottom: 38, position: "relative" }}><Wordmark size={30} glow /></div>
      <div style={{ position: "relative", textAlign: "center" }}>
        <Words text="Trust the deal." size={116} delay={8} />
        <div style={{ position: "relative", display: "inline-block", marginTop: 6 }}>
          <Words text="Not the stranger." size={116} delay={24} color={C.ink} />
          <div style={{ position: "absolute", left: 0, bottom: -16, height: 7, borderRadius: 4, background: C.accent, width: `${underline * 100}%`, boxShadow: "0 0 18px rgba(233,162,26,0.6)" }} />
        </div>
      </div>
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
}

/* ===================== SCENE 2 · PROBLEM (light) ===================== */
function Problem({ dur }: { dur: number }) {
  const frame = useCurrentFrame();
  const head = useRise(4);
  const card = useRise(26);
  const scan = interpolate(frame, [60, 150], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tag = spring({ frame: frame - 120, fps: 30, config: { damping: 200 } });
  const out = useSceneFade(dur);
  const rows: [string, string][] = [["Buyer", "Jane Doe"], ["Seller", "Mark R."], ["Amount", "$420.00"], ["Item", "Vintage camera"]];
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <MeshBg />
      <DotGrid />
      <Particles count={28} />
      <div style={{ ...head, fontFamily: FONT, fontWeight: 700, fontSize: 52, color: C.ink, marginBottom: 42, textAlign: "center", letterSpacing: "-0.03em" }}>
        Escrow should fix that.<br /><span style={{ color: C.inkMute, fontWeight: 600, fontSize: 38 }}>But it leaks the whole deal onto a public ledger.</span>
      </div>
      <GlassCard style={{ ...card, width: 660, padding: 34, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontFamily: FONT, fontSize: 20, color: C.inkMute, letterSpacing: "0.02em" }}>Public escrow record</span>
          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: "#b91c1c", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 999, padding: "5px 12px", opacity: tag, transform: `scale(${0.8 + tag * 0.2})` }}>● VISIBLE TO EVERYONE</span>
        </div>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "13px 0", borderTop: `1px solid ${C.line}`, fontFamily: FONT, fontSize: 25 }}>
            <span style={{ color: C.inkMute }}>{k}</span>
            <span style={{ color: C.ink, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
        {/* scan line sweeping the exposed data */}
        <div style={{ position: "absolute", left: 0, right: 0, top: `${scan}%`, height: 2, background: "linear-gradient(90deg,transparent,rgba(185,28,28,0.8),transparent)", boxShadow: "0 0 16px rgba(185,28,28,0.6)" }} />
      </GlassCard>
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
}

/* ===================== SCENE 3 · SOLUTION (dark) ===================== */
function Solution({ dur }: { dur: number }) {
  const frame = useCurrentFrame();
  const logo = useRise(8);
  const pill = useRise(46);
  const out = useSceneFade(dur);
  const coins = [0, 1, 2, 3, 4, 5];
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <MeshBg dark />
      <Particles count={56} dark accent />
      {/* orbiting coins */}
      {coins.map((i) => {
        const a = (frame * 0.015) + (i / coins.length) * Math.PI * 2;
        const rx = 420, ry = 230;
        const op = 0.35 + 0.35 * Math.sin(a);
        return (
          <div key={i} style={{ position: "absolute", left: `calc(50% + ${Math.cos(a) * rx}px)`, top: `calc(44% + ${Math.sin(a) * ry}px)`, opacity: op, transform: "translate(-50%,-50%)" }}>
            <Coin size={40} delay={i * 8} />
          </div>
        );
      })}
      <div style={{ ...logo, transform: `${logo.transform} scale(1.7)`, marginBottom: 54 }}><Wordmark size={40} dark glow /></div>
      <Words text="Private escrow for real commerce" size={54} weight={700} color={D.ink} delay={20} maxWidth={1000} />
      <div style={{ ...pill, marginTop: 40 }}><ShieldPill dark>Built on Zcash · Shielded by default</ShieldPill></div>
      <Vignette dark />
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
}

/* ===================== SCENE 4 · FLOW (light) ===================== */
const STEPS: [string, string, React.ReactNode][] = [
  ["Create", "A merchant creates an order", <path key="a" d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />],
  ["Review", "An AI checks the listing — advice only", <path key="b" d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z M12 9a3 3 0 100 6 3 3 0 000-6Z" stroke="currentColor" strokeWidth="1.8" fill="none" />],
  ["Accept", "The buyer reviews a private link & accepts", <path key="c" d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />],
  ["Fund", "Funds held in shielded escrow — amount hidden", <path key="d" d="M12 3l7 3v6c0 4.5-3 7.3-7 8.5C8 19.3 5 16.5 5 12V6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />],
  ["Release", "Delivery confirmed → the merchant is paid", <path key="e" d="M5 12h12m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />],
];
function Flow({ dur }: { dur: number }) {
  const frame = useCurrentFrame();
  const head = useRise(4);
  const out = useSceneFade(dur, 16, 30);
  const start = 56;
  const gap = 118;
  const railTop = 30, railH = (STEPS.length - 1) * 112;
  const progress = interpolate(frame, [start, start + (STEPS.length - 1) * gap + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <MeshBg />
      <DotGrid />
      <Particles count={26} />
      <div style={{ ...head, fontFamily: FONT, fontWeight: 700, fontSize: 48, color: C.ink, marginBottom: 44, letterSpacing: "-0.03em" }}>How it works</div>
      <div style={{ position: "relative", width: 1000 }}>
        {/* rail */}
        <div style={{ position: "absolute", left: 31, top: railTop, width: 3, height: railH, background: C.line, borderRadius: 2 }} />
        <div style={{ position: "absolute", left: 31, top: railTop, width: 3, height: railH * progress, background: `linear-gradient(${C.accent}, ${C.accentInk})`, borderRadius: 2, boxShadow: "0 0 14px rgba(233,162,26,0.6)" }} />
        {/* travelling glow dot */}
        <div style={{ position: "absolute", left: 26, top: railTop + railH * progress - 6, width: 13, height: 13, borderRadius: "50%", background: C.accent, boxShadow: "0 0 18px 4px rgba(233,162,26,0.8)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {STEPS.map(([tag, text, icon], i) => {
            const d = start + i * gap;
            const s = spring({ frame: frame - d, fps: 30, config: { damping: 200 } });
            const active = frame > d - 4;
            const done = frame > d + gap * 0.86;
            return (
              <div key={tag} style={{ display: "flex", alignItems: "center", gap: 28, opacity: s, transform: `translateX(${(1 - s) * 44}px)` }}>
                <div style={{ position: "relative", zIndex: 2, flexShrink: 0, width: 64, height: 64, borderRadius: 18, background: done ? C.ink : active ? C.accent : C.bgSunk, color: active || done ? "#fff" : C.inkMute, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: active ? `0 12px 30px -8px ${C.accent}` : "none", transition: "all .3s" }}>
                  {done ? (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">{icon}</svg>
                  )}
                </div>
                <GlassCard style={{ flex: 1, padding: "20px 28px", transform: active ? "translateY(-2px)" : "none" }} glow={active && !done}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: C.ink, letterSpacing: "-0.02em" }}>{tag}</span>
                    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.accentInk, background: C.accentWash, borderRadius: 999, padding: "2px 10px" }}>{i + 1}</span>
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 23, color: C.inkSoft, marginTop: 3 }}>{text}</div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      </div>
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
}

/* ===================== SCENE 5 · PRIVACY (dark) ===================== */
function Privacy({ dur }: { dur: number }) {
  const frame = useCurrentFrame();
  const head = useRise(4);
  const out = useSceneFade(dur);
  const points = ["Amounts & parties stay shielded", "No seed phrases to paste", "AI advises · a human decides disputes"];
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <MeshBg dark />
      <Particles count={44} dark accent />
      <div style={{ ...head, fontFamily: FONT, fontWeight: 700, fontSize: 52, color: D.ink, marginBottom: 54, letterSpacing: "-0.03em", textShadow: `0 0 30px ${D.glow}` }}>Private by design</div>
      <div style={{ display: "flex", gap: 28 }}>
        {points.map((p, i) => {
          const s = spring({ frame: frame - (24 + i * 18), fps: 30, config: { damping: 200 } });
          return (
            <GlassCard key={p} dark glow style={{ width: 360, height: 300, padding: 34, display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: s, transform: `translateY(${(1 - s) * 34}px)` }}>
              <GlowShield size={56} dark delay={i * 20} />
              <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 28, color: D.ink, lineHeight: 1.25 }}>{p}</div>
            </GlassCard>
          );
        })}
      </div>
      <Vignette dark />
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
}

/* ===================== SCENE 6 · CLOSE (dark) ===================== */
function Close({ dur }: { dur: number }) {
  const frame = useCurrentFrame();
  const logo = useRise(6);
  const tag = useRise(24);
  const foot = useRise(44);
  const sweep = interpolate(frame, [0, dur], [-30, 130]);
  const out = interpolate(frame, [0, 18, dur - 30, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <MeshBg dark />
      <Particles count={60} dark accent />
      {/* light sweep behind the logo */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sweep}%`, width: "30%", background: "linear-gradient(90deg,transparent,rgba(244,183,40,0.14),transparent)" }} />
      <div style={{ ...logo, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 22, padding: 16, display: "flex", boxShadow: `0 0 40px -6px ${D.glow}` }}><ZMark size={66} /></div>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 76, letterSpacing: "-0.04em", color: "#fff" }}>Zecrow</span>
      </div>
      <div style={{ ...tag, fontFamily: FONT, fontSize: 34, color: "rgba(255,255,255,0.84)", marginTop: 32, textAlign: "center" }}>
        Private escrow for real commerce on Zcash.
      </div>
      <div style={{ ...foot, fontFamily: FONT, fontSize: 19, color: "rgba(255,255,255,0.42)", marginTop: 42, letterSpacing: "0.14em", textTransform: "uppercase" }}>
        Testnet prototype · The Zecathon
      </div>
      <Vignette dark />
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
}

/* ===================== TIMELINE ===================== */
type SceneDef = { Comp: (p: { dur: number }) => React.ReactElement; dur: number; lead: number; vo: string | null };
const SCENES: SceneDef[] = [
  { Comp: Hook, dur: 167, lead: 14, vo: "vo-1-hook.mp3" },         // 4.44s
  { Comp: Problem, dur: 248, lead: 12, vo: "vo-2-problem.mp3" },   // 7.26s
  { Comp: Solution, dur: 278, lead: 12, vo: "vo-3-solution.mp3" }, // 8.25s
  { Comp: Flow, dur: 694, lead: 14, vo: "vo-4-flow.mp3" },         // 22.0s
  { Comp: Privacy, dur: 311, lead: 12, vo: "vo-5-privacy.mp3" },   // 9.38s
  { Comp: Close, dur: 175, lead: 0, vo: null },                    // music only
];
const OVERLAP = 14;
export const DEMO_DURATION = SCENES.reduce((sum, s, i) => sum + s.dur - (i > 0 ? OVERLAP : 0), 0);

export function ZecrowDemo() {
  let start = 0;
  const placed = SCENES.map((s, i) => {
    const from = i === 0 ? 0 : start - OVERLAP;
    start = from + s.dur;
    return { ...s, from };
  });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {AUDIO && <Audio src={staticFile("music.mp3")} volume={0.17} />}
      {placed.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur}>
          <s.Comp dur={s.dur} />
          {AUDIO && s.vo && (
            <Sequence from={s.lead}>
              <Audio src={staticFile(s.vo)} />
            </Sequence>
          )}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
