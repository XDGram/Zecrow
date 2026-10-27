"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

/**
 * Cinematic scroll reveal: elements rise, un-blur and settle as they
 * enter view. Honors prefers-reduced-motion (renders static).
 */
export default function Reveal({
  children,
  delay = 0,
  y = 40,
  blur = 10,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  blur?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: `blur(${blur}px)` }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{
        duration: 1.05,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
