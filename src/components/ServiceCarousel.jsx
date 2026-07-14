import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ToolIcon from "./ToolIcon";

const serviceSlides = [
  {
    title: "Expert Electrician Services",
    description:
      "Book trusted professionals for wiring, switchboard repair, lighting installation, and electrical maintenance.",
    image:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1600&q=80",
    searchTerm: "Electrician",
  },
  {
    title: "Reliable Plumbing Services",
    description:
      "Get help with leaking pipes, fittings, installations, drainage, and general plumbing repairs.",
    image:
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1600&q=80",
    searchTerm: "Plumber",
  },
  {
    title: "Professional Carpentry",
    description:
      "Book carpenters for furniture repair, installations, custom woodwork, and home improvements.",
    image:
      "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=1600&q=80",
    searchTerm: "Carpenter",
  },
  {
    title: "Fast AC Repair",
    description:
      "Schedule AC servicing, installation, cooling repair, cleaning, and maintenance at your doorstep.",
    image:
      "https://images.unsplash.com/photo-1621905252472-943afaa20e20?auto=format&fit=crop&w=1600&q=80",
    searchTerm: "AC Repair",
  },
  {
    title: "Complete Home Cleaning",
    description:
      "Hire trained professionals for deep cleaning, kitchen cleaning, bathroom cleaning, and more.",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1600&q=80",
    searchTerm: "Cleaner",
  },
  {
    title: "Learn with Verified Tutors",
    description:
      "Connect with experienced tutors for personalised learning and academic support.",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80",
    searchTerm: "Tutor",
  },
  {
    title: "Home Painting Services",
    description:
      "Transform your space with professional interior and exterior painting services.",
    image:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1600&q=80",
    searchTerm: "Painter",
  },
  {
    title: "Trusted Driver Services",
    description:
      "Book reliable drivers for local travel, daily journeys, and scheduled transportation needs.",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
    searchTerm: "Driver",
  },
];

export default function ServiceCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [failedImages, setFailedImages] = useState(() => new Set());
  const navigate = useNavigate();
  const autoplayPaused = isHovered || hasFocus;

  useEffect(() => {
    if (autoplayPaused) return undefined;

    const autoplayInterval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % serviceSlides.length);
    }, 4000);

    return () => window.clearInterval(autoplayInterval);
  }, [autoplayPaused]);

  const showPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? serviceSlides.length - 1 : current - 1
    );
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % serviceSlides.length);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }
  };

  const handleImageError = (index, event) => {
    event.currentTarget.style.display = "none";
    setFailedImages((current) => new Set(current).add(index));
  };

  const exploreService = () => {
    const searchTerm = serviceSlides[activeIndex].searchTerm;
    navigate(`/register?service=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <section className="service-carousel-section section-pad" aria-labelledby="service-carousel-title">
      <div className="container-sahayak">
        <div className="service-carousel-heading">
          <span className="eyebrow">Explore services</span>
          <h2 id="service-carousel-title">Services for every need</h2>
          <p>
            Discover trusted professionals for your home, education, travel, and everyday requirements.
          </p>
        </div>

        <div
          className="service-carousel"
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured Sahayak services"
          tabIndex="0"
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setHasFocus(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
          }}
        >
          <div className="service-carousel-track" aria-live="polite">
            {serviceSlides.map((slide, index) => {
              const isActive = index === activeIndex;
              const imageFailed = failedImages.has(index);

              return (
                <article
                  className={`service-carousel-slide ${isActive ? "is-active" : ""} ${imageFailed ? "has-image-fallback" : ""}`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${serviceSlides.length}: ${slide.title}`}
                  aria-hidden={!isActive}
                  key={slide.title}
                >
                  {!imageFailed && (
                    <img
                      src={slide.image}
                      alt=""
                      loading={index === 0 ? "eager" : "lazy"}
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        console.warn("Failed to load carousel image:", slide.image);
                        handleImageError(index, event);
                      }}
                    />
                  )}
                  <div className="service-carousel-overlay" />
                  <div className="service-carousel-content">
                    <span className="service-carousel-category">{slide.searchTerm}</span>
                    <h3>{slide.title}</h3>
                    <p>{slide.description}</p>
                    <button
                      type="button"
                      className="btn-sahayak btn-sahayak-primary service-carousel-cta"
                      onClick={exploreService}
                      tabIndex={isActive ? 0 : -1}
                    >
                      Explore Service <ToolIcon name="arrow-right" size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            className="service-carousel-arrow service-carousel-arrow-prev"
            onClick={showPrevious}
            aria-label="Show previous service"
          >
            <ToolIcon name="arrow-right" size={20} />
          </button>
          <button
            type="button"
            className="service-carousel-arrow service-carousel-arrow-next"
            onClick={showNext}
            aria-label="Show next service"
          >
            <ToolIcon name="arrow-right" size={20} />
          </button>

          <div className="service-carousel-dots" role="group" aria-label="Choose a service slide">
            {serviceSlides.map((slide, index) => (
              <button
                type="button"
                className={index === activeIndex ? "is-active" : ""}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${slide.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
                key={slide.title}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export { serviceSlides };
