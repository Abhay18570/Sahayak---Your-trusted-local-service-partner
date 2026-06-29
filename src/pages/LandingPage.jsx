import React from "react";
import { useNavigate } from "react-router-dom";
import ToolIcon from "../components/ToolIcon";

const testimonials = [
  {
    name: "Neha Kulkarni",
    locality: "Thane",
    quote: "Booked an electrician at 9pm and he was at my door in forty minutes.",
    rating: 5,
  },
  {
    name: "Arvind Rao",
    locality: "Navi Mumbai",
    quote: "The provider's service matched the rating shown on Sahayak.",
    rating: 5,
  },
  {
    name: "Sana Iqbal",
    locality: "Mumbai",
    quote: "Found a Maths tutor within a day, with the price shown upfront.",
    rating: 4,
  },
];

const steps = [
  {
    icon: "search",
    title: "Tell us the job",
    body: "Pick a category — Electrician, Plumber, Tutor — and your locality. Takes ten seconds.",
  },
  {
    icon: "filter",
    title: "Compare verified pros",
    body: "See ratings, years of experience and upfront pricing side by side. No guesswork.",
  },
  {
    icon: "calendar",
    title: "Book a slot",
    body: "Choose a time that works for you. Most providers can reach you within the day.",
  },
  {
    icon: "check",
    title: "Get it done",
    body: "Pay after the job's done, then rate your provider so the next customer knows too.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <>
      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="container-sahayak hero-grid">
          <div className="hero-content">
            <span className="hero-eyebrow">
              <ToolIcon name="shield" size={14} /> 12,000+ verified local pros
            </span>
            <h1>
              Your trusted <span className="accent">local service</span>{" "}
              partner
            </h1>
            <p className="hero-sub">
              From a flickering switchboard to next week's maths exam —
              Sahayak connects you with background-checked electricians,
              plumbers, carpenters, tutors and more, near you, today.
            </p>
            <div className="hero-actions">
              <button
                className="btn-sahayak btn-sahayak-primary"
                onClick={() => navigate("/login")}
              >
                Find a service <ToolIcon name="arrow-right" size={16} />
              </button>
              <button
                className="btn-sahayak btn-sahayak-outline-light"
                onClick={() => navigate("/register-provider")}
              >
                Become a provider
              </button>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>12,400+</strong>
                <span>Verified providers</span>
              </div>
              <div className="hero-stat">
                <strong>48 min</strong>
                <span>Avg. response time</span>
              </div>
              <div className="hero-stat">
                <strong>4.8 / 5</strong>
                <span>Average rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="section-pad" id="how-it-works">
        <div className="container-sahayak">
          <div className="section-head">
            <div>
              <span className="eyebrow">The process</span>
              <h2>How Sahayak works</h2>
              <p>Four steps between "I have a problem" and "it's fixed."</p>
            </div>
          </div>

          <div className="how-it-works-grid">
            {steps.map((s, i) => (
              <div className="how-step" key={s.title}>
                <span className="how-step-index">Step {String(i + 1).padStart(2, "0")}</span>
                <div className="how-step-icon">
                  <ToolIcon name={s.icon} size={24} />
                </div>
                <h5>{s.title}</h5>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="testimonials-section section-pad">
        <div className="container-sahayak">
          <div className="section-head">
            <div>
              <span className="eyebrow on-dark">What customers say</span>
              <h2 style={{ color: "white" }}>Real jobs, real reviews</h2>
              <p>No anonymous five-stars — every review is tied to a completed booking.</p>
            </div>
          </div>

          <div className="testimonial-grid">
            {testimonials.map((t) => (
              <div className="testimonial-card" key={t.name}>
                <div className="testimonial-stars">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <ToolIcon name="star" size={15} key={i} />
                  ))}
                </div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-author-avatar">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.locality}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="section-pad" style={{ paddingTop: 0 }}>
        <div className="container-sahayak">
          <div className="cta-strip">
            <div>
              <h3>Got a skill? Start earning on your own time.</h3>
              <p>Join 12,000+ verified providers already getting booked through Sahayak.</p>
            </div>
            <div className="cta-strip-actions">
              <button
                className="btn-sahayak btn-sahayak-teal"
                onClick={() => navigate("/register-provider")}
              >
                Register as provider
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
