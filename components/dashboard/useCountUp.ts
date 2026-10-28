"use client";

import { useEffect, useState } from "react";

/** Eased count-up for KPI numbers. Respects reduced-motion (jumps to target). */
export function useCountUp(target: number, duration = 1100, decimals = 0) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString();
}
