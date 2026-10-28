"use client";

import { motion, useReducedMotion } from "framer-motion";

/* Animated, on-brand illustrations for the two order types. Zcash gold + ink. */

export function PhysicalIllustration() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 64 64" width="60" height="60" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="pg-top" x1="14" y1="14" x2="50" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe29a" />
          <stop offset="1" stopColor="#f4b728" />
        </linearGradient>
        <linearGradient id="pg-left" x1="14" y1="22" x2="32" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f3bd3c" />
          <stop offset="1" stopColor="#d6940f" />
        </linearGradient>
      </defs>

      <motion.ellipse
        cx="32" cy="56" rx="16" ry="3" fill="#0b0b0d"
        animate={reduce ? { opacity: 0.1 } : { rx: [16, 13, 16], opacity: [0.12, 0.07, 0.12] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.g animate={reduce ? {} : { y: [0, -3.5, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
        {/* top */}
        <path d="M32 12 L50 21 L32 30 L14 21 Z" fill="url(#pg-top)" />
        {/* left */}
        <path d="M14 21 L32 30 L32 50 L14 41 Z" fill="url(#pg-left)" />
        {/* right */}
        <path d="M50 21 L32 30 L32 50 L50 41 Z" fill="#c8890e" />
        {/* tape */}
        <path d="M32 30 L32 50" stroke="#0b0b0d" strokeOpacity="0.22" strokeWidth="2" />
        <path d="M23 15.5 L41 15.5" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.4" transform="translate(0,2)" />
        {/* label */}
        <rect x="18.5" y="33" width="9" height="6" rx="1" fill="#fff" fillOpacity="0.9" />
        <path d="M20 35.5 h6 M20 37.3 h4" stroke="#cf8f12" strokeWidth="0.9" strokeLinecap="round" />
      </motion.g>

      <motion.g
        animate={reduce ? { opacity: 0.9 } : { opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
        transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{ transformOrigin: "49px 14px" }}
      >
        <path d="M49 11 l0.9 2.1 l2.1 0.9 l-2.1 0.9 l-0.9 2.1 l-0.9 -2.1 l-2.1 -0.9 l2.1 -0.9 Z" fill="#f4b728" />
      </motion.g>
    </svg>
  );
}

export function DigitalIllustration() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 64 64" width="60" height="60" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="dg-badge" x1="34" y1="36" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffdc7a" />
          <stop offset="1" stopColor="#e3990f" />
        </linearGradient>
      </defs>

      <motion.ellipse
        cx="32" cy="56" rx="15" ry="3" fill="#0b0b0d"
        animate={reduce ? { opacity: 0.1 } : { opacity: [0.1, 0.07, 0.1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.g animate={reduce ? {} : { y: [0, -2.5, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
        {/* document */}
        <path d="M18 13 h16 l8 8 v26 a2 2 0 0 1 -2 2 h-20 a2 2 0 0 1 -2 -2 Z" fill="#ffffff" stroke="#e8dec2" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M34 13 v6 a2 2 0 0 0 2 2 h6" fill="#fdeccb" stroke="#e8dec2" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M23 30 h14 M23 35 h14 M23 40 h9" stroke="#d8cca6" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* download badge */}
      <circle cx="45" cy="45" r="10.5" fill="url(#dg-badge)" stroke="#fff" strokeWidth="1.5" />
      <motion.path
        d="M45 40 v7 m0 0 l-3 -3 m3 3 l3 -3"
        stroke="#0b0b0d" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
        animate={reduce ? {} : { y: [0, 2.2, 0] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
