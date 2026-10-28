"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import EscrowPanel from "./EscrowPanel";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay: 0.1 + i * 0.09, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Hero() {
  const router = useRouter();
  const [loadingDemo, setLoadingDemo] = useState(false);

  const openDemoOrder = async () => {
    setLoadingDemo(true);
    try {
      const response = await fetch("/api/demo-order", { method: "POST" });
      const result = (await response.json()) as { href?: string; error?: string };
      if (response.ok && result.href) {
        router.push(result.href);
      } else {
        setLoadingDemo(false);
      }
    } catch {
      setLoadingDemo(false);
    }
  };

  return (
    <section id="top" className="relative overflow-hidden pt-32 md:pt-36">
      {/* faint dotted texture top */}
      <div className="dotgrid pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-60" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center text-center">
          <motion.a
            href="#how"
            custom={0}
            variants={fade}
            initial="hidden"
            animate="show"
            className="chip"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Managed escrow prototype on Zcash
            <span className="chip-tag">See how →</span>
          </motion.a>

          <motion.h1
            custom={1}
            variants={fade}
            initial="hidden"
            animate="show"
            className="display mt-7 text-[clamp(2.6rem,7vw,5.5rem)]"
          >
            Trust the deal.
            <br />
            Not the stranger.
          </motion.h1>

          <motion.p
            custom={2}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-7 max-w-xl text-[16px] leading-relaxed text-ink-soft"
          >
            Zecrow is a hackathon prototype exploring private commerce on Zcash. The product flow is designed around managed escrow, while order persistence, payment verification, and fund release are still being built.
          </motion.p>

          <motion.div
            custom={3}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            <a href="/dashboard/create" className="btn btn-dark px-6">
              Create an escrow
            </a>
            <button type="button" onClick={() => void openDemoOrder()} disabled={loadingDemo} className="btn btn-ghost px-6 disabled:opacity-60">
              <PlayIcon /> {loadingDemo ? "Opening demo…" : "View a demo order"}
            </button>
          </motion.div>

          <motion.p
            custom={4}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-5 text-[13px] text-ink-mute"
          >
            No seed phrases to paste · Shielded by default
          </motion.p>
        </div>

        {/* product panel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-16 max-w-3xl"
        >
          <EscrowPanel />
        </motion.div>
      </div>
    </section>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-ink">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
