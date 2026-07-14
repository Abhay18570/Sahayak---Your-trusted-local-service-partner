import React, { useState } from "react";
import { ChevronDown, CircleHelp, Mail, Phone } from "lucide-react";

const faqItems = [
  {
    question: "How do I book a service?",
    answer:
      "Simply search for your required service, choose a verified provider, select your preferred date and time, confirm your booking, and complete the secure payment. Your provider will arrive at the scheduled location.",
  },
  {
    question: "How are providers verified?",
    answer:
      "Every provider goes through identity verification, Aadhaar verification, profile review, and admin approval before becoming available on the platform. Customer ratings further help maintain service quality.",
  },
  {
    question: "Can I cancel a booking?",
    answer:
      "Yes. Customers can cancel bookings before the provider begins the service. Cancellation policies may vary depending on the booking status.",
  },
  {
    question: "How do payments work?",
    answer:
      "Payments are processed securely using Razorpay. Customers can pay online through UPI, debit cards, credit cards, or net banking. Providers receive their earnings directly in their wallet after successful service completion.",
  },
  {
    question: "How do refunds work?",
    answer:
      "If a booking is cancelled according to the cancellation policy or an eligible issue occurs, the refund is processed back to the original payment method within the applicable processing period.",
  },
  {
    question: "How is my data protected?",
    answer:
      "Your personal information is securely stored and protected using encrypted communication and secure authentication. Sensitive information is never shared with unauthorized users.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleQuestion = (index) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section className="faq-section section-pad" aria-labelledby="faq-title">
      <div className="container-sahayak faq-container">
        <div className="faq-heading">
          <span className="faq-heading-icon" aria-hidden="true">
            <CircleHelp size={22} />
          </span>
          <span className="eyebrow">Help center</span>
          <h2 id="faq-title">Frequently Asked Questions</h2>
          <p>Everything you need to know before booking a service through Sahayak.</p>
        </div>

        <div className="faq-list">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            const buttonId = `faq-question-${index}`;
            const panelId = `faq-answer-${index}`;

            return (
              <article className={`faq-card ${isOpen ? "is-open" : ""}`} key={item.question}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    className="faq-question"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleQuestion(index)}
                  >
                    <span>{item.question}</span>
                    <ChevronDown className="faq-chevron" size={21} aria-hidden="true" />
                  </button>
                </h3>
                <div
                  id={panelId}
                  className="faq-answer"
                  role="region"
                  aria-labelledby={buttonId}
                  aria-hidden={!isOpen}
                >
                  <div>
                    <p>{item.answer}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="faq-support-cta">
          <div>
            <h3>Still have questions?</h3>
            <p>Our support team is always here to help.</p>
          </div>
          <div className="faq-support-actions">
            <a
              className="btn-sahayak btn-sahayak-primary"
              href="tel:+919834244904"
              aria-label="Call Sahayak support"
            >
              <Phone size={17} aria-hidden="true" /> Contact Support
            </a>
            <a
              className="btn-sahayak btn-sahayak-teal"
              href="mailto:teamsahayak03@gmail.com"
              aria-label="Email Sahayak support"
            >
              <Mail size={17} aria-hidden="true" /> Email Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export { faqItems };
