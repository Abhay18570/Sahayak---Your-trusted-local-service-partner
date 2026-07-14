import React from "react";
import sahayakLogo from "../sahayak_logo/Sahayak_logo.png";

const particleColors = [
  "#f97316",
  "#ea580c",
  "#fb923c",
  "#fdba74",
  "#ffffff",
  "#374151",
];

const logoParticles = Array.from({ length: 56 }, (_, id) => {
  const startAngle = (id * 137.508 * Math.PI) / 180;
  const moveAngle = ((id * 73 + (id % 4) * 29) * Math.PI) / 180;
  const startDistance = 8 + (id % 8) * 5.4;
  const moveDistance = 24 + (id % 9) * 3.8;

  return {
    id,
    startX: Math.round(Math.cos(startAngle) * startDistance),
    startY: Math.round(Math.sin(startAngle) * startDistance),
    moveX: Math.round(Math.cos(moveAngle) * moveDistance),
    moveY: Math.round(Math.sin(moveAngle) * moveDistance),
    size: 3 + (id % 7),
    delay: (id % 8) * 0.018,
    duration: 0.68 + (id % 5) * 0.055,
    rotation: ((id * 47) % 180) - 90,
    color: particleColors[id % particleColors.length],
    glows: id % 4 === 0,
    orbits: id % 13 === 0,
  };
});

export default function AnimatedLogo({ className = "" }) {
  return (
    <div className={`animated-logo ${className}`.trim()}>
      <div className="animated-logo-stage">
        <span className="animated-logo-glow" aria-hidden="true" />
        <img
          className="animated-logo-image"
          src={sahayakLogo}
          alt="Sahayak logo"
          draggable="false"
        />
        <span className="animated-logo-particles" aria-hidden="true">
          {logoParticles.map((particle) => (
            <span
              className={`animated-logo-particle ${particle.glows ? "is-glowing" : ""} ${particle.orbits ? "is-orbiting" : ""}`}
              style={{
                "--x": `${particle.startX}px`,
                "--y": `${particle.startY}px`,
                "--move-x": `${particle.moveX}px`,
                "--move-y": `${particle.moveY}px`,
                "--size": `${particle.size}px`,
                "--delay": `${particle.delay}s`,
                "--duration": `${particle.duration}s`,
                "--rotation": `${particle.rotation}deg`,
                "--particle-color": particle.color,
              }}
              key={particle.id}
            >
              <span />
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

export { logoParticles };
