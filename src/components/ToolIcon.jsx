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
    case "home":
      return (
        <svg {...common}>
          <path d="M5 23 24 7l19 16" />
          <path d="M10 20v22h28V20M19 42V28h10v14" />
        </svg>
      );
    case "hammer":
      return (
        <svg {...common}>
          <path d="m18 17 18 18M13 42l-7-7 18-18 7 7Z" />
          <path d="m20 7 7-3 12 12-8 8Z" />
        </svg>
      );
    case "paint":
      return (
        <svg {...common}>
          <rect x="7" y="8" width="27" height="11" rx="2" />
          <path d="M34 13h6v13H24v6M24 32v11" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <path d="M7 12h31a4 4 0 0 1 4 4v23H9a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4h25" />
          <path d="M30 23h12v10H30a5 5 0 0 1 0-10Z" />
        </svg>
      );
    case "coins":
      return (
        <svg {...common}>
          <ellipse cx="18" cy="13" rx="11" ry="5" />
          <path d="M7 13v9c0 3 5 5 11 5s11-2 11-5v-9M7 22v9c0 3 5 5 11 5 2 0 4-.2 5.5-.7" />
          <path d="M29 25c7 0 12 2 12 5s-5 5-12 5-12-2-12-5" />
          <path d="M17 30v7c0 3 5 5 12 5s12-2 12-5v-7" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="7" />
          <path d="M24 5v5M24 38v5M5 24h5M38 24h5M10.5 10.5l3.6 3.6M33.9 33.9l3.6 3.6M37.5 10.5l-3.6 3.6M14.1 33.9l-3.6 3.6" />
        </svg>
      );
    case "chart":
    case "analytics":
      return (
        <svg {...common}>
          <path d="M7 41V8M7 41h35" />
          <path d="m13 33 8-9 7 5 11-15" />
          <circle cx="13" cy="33" r="2" /><circle cx="21" cy="24" r="2" /><circle cx="28" cy="29" r="2" /><circle cx="39" cy="14" r="2" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="18" cy="17" r="7" /><circle cx="34" cy="19" r="5" />
          <path d="M5 41c1-9 6-14 13-14s12 5 13 14M29 29c7 0 11 4 12 11" />
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
