// A small hand-built icon set styled like tool/trade marks rather than
// generic line icons — this is the page's signature device: every
// category reads like a stamped badge from a toolbox, not a UI kit glyph.
import React from "react";

const stroke = "currentColor";

export function ToolIcon({ name, size = 28, className = "" }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    fill: "none",
    stroke,
    strokeWidth: 2.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };

  switch (name) {
    case "bolt": // Electrician
      return (
        <svg {...common}>
          <path d="M26 4 12 26h9l-3 18 18-26h-10l4-14Z" strokeLinejoin="round" />
        </svg>
      );
    case "drop": // Plumber
      return (
        <svg {...common}>
          <path d="M24 6c7 9 12 16.5 12 23a12 12 0 1 1-24 0c0-6.5 5-14 12-23Z" />
          <path d="M18 30c0 3 2.5 5.5 6 5.5" />
        </svg>
      );
    case "saw": // Carpenter
      return (
        <svg {...common}>
          <path d="M6 34 30 10" />
          <path d="M30 10l4 1-1 4-4-1-1-4 2-0Z" />
          <path d="M6 34l8 4 3-3-3-3-4-2Z" />
          <path d="M14 26l4 4M19 21l4 4M24 16l4 4" />
        </svg>
      );
    case "book": // Tutor
      return (
        <svg {...common}>
          <path d="M24 12c-3.5-3-9-4-15-3v25c6-1 11.5 0 15 3 3.5-3 9-4 15-3V9c-6-1-11.5 0-15 3Z" />
          <path d="M24 12v25" />
        </svg>
      );
    case "wrench": // Mechanic
      return (
        <svg {...common}>
          <path d="M31 9a9 9 0 0 0-12.5 10.8L6 32.3 11.7 38l12.5-12.5A9 9 0 0 0 35 13l-6 6-4-4 6-6Z" />
        </svg>
      );
    case "spark": // Cleaner
      return (
        <svg {...common}>
          <path d="M16 8v10M11 13h10" />
          <path d="M32 22c1.5 5 4 7.5 9 9-5 1.5-7.5 4-9 9-1.5-5-4-7.5-9-9 5-1.5 7.5-4 9-9Z" />
          <path d="M14 28c.8 3 2.4 4.6 5.4 5.4-3 .8-4.6 2.4-5.4 5.4-.8-3-2.4-4.6-5.4-5.4 3-.8 4.6-2.4 5.4-5.4Z" />
        </svg>
      );
    case "snow": // AC repair
      return (
        <svg {...common}>
          <path d="M24 6v36M10 14l28 20M38 14 10 34" />
          <path d="M24 6l-4 4M24 6l4 4M24 42l-4-4M24 42l4-4" />
          <path d="M10 14l5.2 1M10 14l1-5.2M38 14l-5.2 1M38 14l-1-5.2M10 34l5.2-1M10 34l1 5.2M38 34l-5.2-1M38 34l-1 5.2" />
        </svg>
      );
    case "shield": // verified
      return (
        <svg {...common}>
          <path d="M24 5 8 11v12c0 11 7 17.5 16 20 9-2.5 16-9 16-20V11Z" />
          <path d="M17 24l5 5 10-11" />
        </svg>
      );
    case "star":
      return (
        <svg {...common} strokeWidth={0} fill={stroke}>
          <path d="M24 5l6.2 13.1L44 20l-10 9.7L36.5 44 24 36.8 11.5 44 14 29.7 4 20l13.8-1.9Z" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M24 6c-8 0-14 6.2-14 14 0 10.5 14 22 14 22s14-11.5 14-22c0-7.8-6-14-14-14Z" />
          <circle cx="24" cy="20" r="4.5" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="21" cy="21" r="13" />
          <path d="M30.5 30.5 41 41" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="7" y="10" width="34" height="31" rx="3" />
          <path d="M7 19h34M15 6v8M33 6v8" />
        </svg>
      );
    case "history":
      return (
        <svg {...common}>
          <path d="M8 24a16 16 0 1 0 4.7-11.3" />
          <path d="M4 8v9h9" />
          <path d="M24 15v9l6 5" />
        </svg>
      );
    case "filter":
      return (
        <svg {...common}>
          <path d="M6 10h36M14 24h20M20 38h8" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="24" cy="16" r="8" />
          <path d="M8 41c2-9 9-14 16-14s14 5 16 14" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M11 8c1 7 4 13 8 17s10 7 17 8l3-7c-3-1-6-2.5-8.5-4.5l-4 3c-3-2-5.5-4.5-7.5-7.5l3-4C19.5 11 18 8 17 5l-6 3Z" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="6" y="11" width="36" height="26" rx="3" />
          <path d="M8 13l16 13 16-13" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="18" />
          <path d="M16 24l6 6 11-13" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common}>
          <path d="M8 24h32M28 12l12 12-12 12" />
        </svg>
      );
    default:
      return null;
  }
}

export default ToolIcon;
