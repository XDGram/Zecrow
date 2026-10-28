import {
  AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { C, FONT } from "./brand";

// Flip to true once you add public/voiceover.mp3 (and optionally public/music.mp3).
const AUDIO = false;

/* ---------- helpers ---------- */
function useRise(delay = 0, dist = 28) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.7 } });
  return { opacity: s, transform: `translateY(${(1 - s) * dist}px)` };
}
function fadeInOut(frame: number, inEnd: number, outStart: number, outEnd: number) {
  return interpolate(frame, [0, inEnd, outStart, outEnd], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

function Mark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M6 25.2C8.2 18.1 14.2 13.2 21.6 12.6C24.5 9.1 31.5 9.3 35.1 14.2L45.5 18.8L37.4 22.4L34.6 28.3C32.5 34.3 25.8 37 19.3 33.8L11.4 39L12.8 30.9C9.4 29.8 7.1 27.8 6 25.2Z" fill={C.ink} />
      <path d="M17.3 27.2C20.8 29.7 25.8 30 29.8 28.2" stroke="#fff" strokeOpacity="0.72" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="29.2" cy="18.1" r="1.55" fill={C.accent} />
    </svg>
  );
}
function Wordmark({ size = 34 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Mark size={size * 1.25} />
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: "-0.04em", color: C.ink }}>Zecrow</span>
    </div>
  );
}
function ShieldPill({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const frame = useCurrentFrame();
  const shimmer = interpolate((frame - delay) % 70, [0, 70], [-120, 220]);
  return (
    <div style={{ position: "relative", overflow: "hidden", display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 20px", borderRadius: 999, background: C.accentWash, border: `1px solid ${C.accentSoft}`, color: C.accentInk, fontFamily: FONT, fontWeight: 600, fontSize: 24 }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${shimmer}%`, width: "35%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)" }} />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 4.5-3 7.3-7 8.5C8 19.3 5 16.5 5 12V6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span style={{ position: "relative" }}>{children}</span>
    </div>
  );
}

/* ---------- scenes ---------- */
function Hook() {
  const frame = useCurrentFrame();
  const kicker = useRise(0);
  const l1 = useRise(10);
  const l2 = useRise(22);
  const underline = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const out = fadeInOut(frame, 10, 180, 210);
  return (
    <AbsoluteFill style={{ background: C.bg, justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ ...kicker, marginBottom: 34 }}><Wordmark size={30} /></div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 110, letterSpacing: "-0.045em", lineHeight: 1.02, textAlign: "center", color: C.ink }}>
        <div style={l1}>Trust the deal.</div>
        <div style={{ ...l2, position: "relative", display: "inline-block" }}>
          Not the stranger<span style={{ color: C.accent }}>.</span>
          <div style={{ position: "absolute", left: 0, bottom: -14, height: 6, borderRadius: 3, background: C.accent, width: `${underline * 100}%` }} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Problem() {
  const frame = useCurrentFrame();
  const head = useRise(4);
  const card = useRise(24);
  const redact = interpolate(frame, [95, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = fadeInOut(frame, 10, 240, 270);
  const rows = [["Buyer", "Jane D."], ["Amount", "$420.00"], ["Item", "Vintage camera"]];
  return (
    <AbsoluteFill style={{ background: C.bgSoft, justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ ...head, fontFamily: FONT, fontWeight: 700, fontSize: 56, color: C.ink, marginBottom: 40, textAlign: "center" }}>
        Escrow should fix that.<br /><span style={{ color: C.inkMute, fontWeight: 600, fontSize: 40 }}>But it leaks everything about the deal.</span>
      </div>
      <div style={{ ...card, width: 620, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 24, padding: 32, boxShadow: "0 30px 60px -30px rgba(0,0,0,0.25)" }}>
        <div style={{ fontFamily: FONT, fontSize: 20, color: C.inkMute, marginBottom: 18 }}>Public escrow record</div>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${C.line}`, fontFamily: FONT, fontSize: 26 }}>
            <span style={{ color: C.inkMute }}>{k}</span>
            <span style={{ position: "relative", color: C.ink, fontWeight: 600 }}>
              {v}
              <span style={{ position: "absolute", inset: "-4px -8px", borderRadius: 8, background: C.ink, transform: `scaleX(${redact})`, transformOrigin: "left" }} />
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function Solution() {
  const frame = useCurrentFrame();
  const logo = useRise(6);
  const line = useRise(22);
  const pill = useRise(40);
  const out = fadeInOut(frame, 12, 270, 300);
  return (
    <AbsoluteFill style={{ background: C.bg, justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ ...logo, transform: `${logo.transform} scale(1.6)`, marginBottom: 48 }}><Wordmark size={40} /></div>
      <div style={{ ...line, fontFamily: FONT, fontWeight: 700, fontSize: 52, color: C.ink, textAlign: "center", letterSpacing: "-0.03em" }}>
        Private escrow for real commerce
      </div>
      <div style={{ ...pill, marginTop: 34 }}><ShieldPill>Built on Zcash · Shielded by default</ShieldPill></div>
    </AbsoluteFill>
  );
}

const STEPS = [
  ["Create", "A merchant creates an order"],
  ["Review", "An AI checks the listing — advice only"],
  ["Accept", "The buyer reviews a private link & accepts"],
  ["Fund", "Funds held in shielded escrow — amount hidden"],
  ["Release", "Delivery confirmed → the merchant is paid"],
];
function Flow() {
  const frame = useCurrentFrame();
  const head = useRise(4);
  const out = fadeInOut(frame, 12, 920, 960);
  const stepStart = 40;
  const stepGap = 170;
  return (
    <AbsoluteFill style={{ background: C.bgSoft, justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ ...head, fontFamily: FONT, fontWeight: 700, fontSize: 48, color: C.ink, marginBottom: 46 }}>How it works</div>
      <div style={{ width: 980, display: "flex", flexDirection: "column", gap: 20 }}>
        {STEPS.map(([tag, text], i) => {
          const d = stepStart + i * stepGap;
          const s = spring({ frame: frame - d, fps: 30, config: { damping: 200 } });
          const done = frame > d + stepGap * 0.8;
          return (
            <div key={tag} style={{ display: "flex", alignItems: "center", gap: 26, opacity: s, transform: `translateX(${(1 - s) * 40}px)` }}>
              <div style={{ position: "relative", flexShrink: 0, width: 64, height: 64, borderRadius: 18, background: done ? C.ink : C.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 28, boxShadow: `0 10px 30px -10px ${C.accent}` }}>
                {done ? "✓" : i + 1}
              </div>
              <div style={{ flex: 1, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 18, padding: "20px 28px" }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: C.ink, letterSpacing: "-0.02em" }}>{tag}</div>
                <div style={{ fontFamily: FONT, fontSize: 24, color: C.inkSoft, marginTop: 2 }}>{text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function Privacy() {
  const frame = useCurrentFrame();
  const head = useRise(4);
  const out = fadeInOut(frame, 12, 270, 300);
  const points = ["Amounts & parties stay shielded", "No seed phrases to paste", "AI advises · a human decides disputes"];
  return (
    <AbsoluteFill style={{ background: C.bg, justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ ...head, fontFamily: FONT, fontWeight: 700, fontSize: 52, color: C.ink, marginBottom: 52, letterSpacing: "-0.03em" }}>Private by design</div>
      <div style={{ display: "flex", gap: 26 }}>
        {points.map((p, i) => {
          const s = spring({ frame: frame - (24 + i * 16), fps: 30, config: { damping: 200 } });
          return (
            <div key={p} style={{ width: 360, height: 280, background: C.bgSoft, border: `1px solid ${C.line}`, borderRadius: 26, padding: 32, display: "flex", flexDirection: "column", justifyContent: "flex-end", opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
              <div style={{ color: C.accentInk, marginBottom: 18 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 4.5-3 7.3-7 8.5C8 19.3 5 16.5 5 12V6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
              </div>
              <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 28, color: C.ink, lineHeight: 1.25 }}>{p}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function Close() {
  const frame = useCurrentFrame();
  const logo = useRise(6);
  const tag = useRise(22);
  const foot = useRise(40);
  const out = interpolate(frame, [0, 14, 190, 210], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.ink, justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ ...logo, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: 14, display: "flex" }}><Mark size={64} /></div>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 72, letterSpacing: "-0.04em", color: "#fff" }}>Zecrow</span>
      </div>
      <div style={{ ...tag, fontFamily: FONT, fontSize: 34, color: "rgba(255,255,255,0.82)", marginTop: 30, textAlign: "center" }}>
        Private escrow for real commerce on Zcash.
      </div>
      <div style={{ ...foot, fontFamily: FONT, fontSize: 20, color: "rgba(255,255,255,0.45)", marginTop: 40, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Testnet prototype · The Zecathon
      </div>
    </AbsoluteFill>
  );
}

export function ZecrowDemo() {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {AUDIO && <Audio src={staticFile("voiceover.mp3")} />}
      {AUDIO && <Audio src={staticFile("music.mp3")} volume={0.16} />}
      <Sequence durationInFrames={210}><Hook /></Sequence>
      <Sequence from={210} durationInFrames={270}><Problem /></Sequence>
      <Sequence from={480} durationInFrames={300}><Solution /></Sequence>
      <Sequence from={780} durationInFrames={960}><Flow /></Sequence>
      <Sequence from={1740} durationInFrames={300}><Privacy /></Sequence>
      <Sequence from={2040} durationInFrames={210}><Close /></Sequence>
    </AbsoluteFill>
  );
}
