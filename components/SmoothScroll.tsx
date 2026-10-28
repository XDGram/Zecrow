"use client";

import { ReactNode, useEffect } from "react";
import Lenis from "lenis";

const HEADER_OFFSET = 76; // clears the fixed nav
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Lenis smooth-scroll provider. Also intercepts in-page anchor clicks
 * (nav tabs, CTAs) and glides to the target section cinematically,
 * accounting for the fixed header. Respects prefers-reduced-motion.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lenis: Lenis | null = null;
    let frame = 0;

    if (!reduced) {
      lenis = new Lenis({
        duration: 1.15,
        easing: easeOutExpo,
        smoothWheel: true,
      });
      const raf = (time: number) => {
        lenis!.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const anchor = (e.target as HTMLElement)?.closest?.('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const id = href.slice(1);
      const toTop = id === "top";
      const target = toTop ? null : document.getElementById(id);
      if (!toTop && !target) return;

      e.preventDefault();

      if (lenis) {
        lenis.scrollTo(toTop ? 0 : (target as HTMLElement), {
          offset: toTop ? 0 : -HEADER_OFFSET,
          duration: 1.5,
          easing: easeOutExpo,
        });
      } else {
        const top = toTop
          ? 0
          : (target as HTMLElement).getBoundingClientRect().top +
            window.scrollY -
            HEADER_OFFSET;
        window.scrollTo({ top, behavior: "smooth" });
      }

      // keep the URL hash in sync without a jump
      history.replaceState(
        null,
        "",
        toTop ? window.location.pathname + window.location.search : href
      );
    };

    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      if (frame) cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
