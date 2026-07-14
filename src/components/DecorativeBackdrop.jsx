import React from "react";
import ToolIcon from "./ToolIcon";

const ICONS = {
  hero: ["pin", "home", "bolt", "wrench", "paint", "spark", "book", "hammer", "settings"],
  login: ["shield", "calendar", "check", "star", "home", "wrench"],
  register: ["user", "wrench", "home", "check", "pin", "spark"],
  customer: ["home", "pin", "calendar", "star", "wallet"],
  provider: ["wrench", "hammer", "wallet", "coins", "calendar", "settings"],
  admin: ["chart", "users", "settings", "analytics", "calendar", "coins"],
  footer: ["bolt", "wrench", "spark", "book", "hammer"],
};

export default function DecorativeBackdrop({ variant = "hero", className = "" }) {
  const icons = ICONS[variant] || ICONS.hero;

  return (
    <div className={`decorative-backdrop decorative-backdrop-${variant} ${className}`.trim()} aria-hidden="true">
      <span className="decorative-blob decorative-blob-one" />
      <span className="decorative-blob decorative-blob-two" />
      <span className="decorative-dot-grid" />
      <svg className="decorative-curve" viewBox="0 0 420 180" fill="none">
        <path d="M8 142C92 26 205 224 412 32" />
        <path d="M34 164C150 78 230 204 382 62" />
      </svg>
      {icons.map((icon, index) => (
        <span className={`decorative-icon decorative-icon-${index + 1}`} key={`${icon}-${index}`}>
          <ToolIcon name={icon} size={index % 3 === 0 ? 30 : 24} />
        </span>
      ))}
    </div>
  );
}

export function ServiceJourney() {
  const steps = [
    ["user", "Customer"],
    ["wrench", "Provider"],
    ["home", "Home service"],
    ["star", "Happy customer"],
  ];

  return (
    <div className="service-journey" aria-label="Customer to completed home service journey">
      {steps.map(([icon, label], index) => (
        <React.Fragment key={label}>
          <div className="service-journey-step">
            <span><ToolIcon name={icon} size={20} /></span>
            <strong>{label}</strong>
          </div>
          {index < steps.length - 1 && <span className="service-journey-arrow" aria-hidden="true">↓</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
