// src/pages/FAQ.jsx
import React, { useState } from "react";
import "./CSS/FAQ.css";

const faqData = {
  "Plans & Tariffs": [
    {
      q: "What are the available plans?",
      a: "We offer Prepaid, Postpaid, and Fibernet plans. Visit the Plans page to view full details including price, speed, and validity.",
    },
    {
      q: "Will my current plan change if I recharge with a new plan?",
      a: "No, your current plan continues until expiry. The new plan will be queued and activated automatically after the current one ends.",
    },
  ],
  "Subscriptions & Payments": [
    {
      q: "What payment methods are supported?",
      a: "You can pay via UPI, Credit/Debit Cards, Net Banking, or popular wallets.",
    },
    {
      q: "Can I cancel an active plan?",
      a: "Yes. Go to Connections → Select a Connection → Cancel Active Plan. Refunds or credits will be adjusted as per policy.",
    },
    {
      q: "Can I set up auto-renewal?",
      a: "Yes, auto-renewal can be enabled from your Profile settings.",
    },
  ],
  "Upgrades & Offers": [
    {
      q: "How do I upgrade my plan?",
      a: "Go to Connections, select the connection you want to upgrade, and click 'Upgrade Plan'. You will only pay the adjusted amount after credits.",
    },
    {
      q: "Are promo codes available?",
      a: "Yes, you can enter valid promo codes during checkout to get discounts.",
    },
  ],
  "Support": [
    {
      q: "How can I reach customer support?",
      a: "You can contact us via phone, email, or the Locate Us / Feedback page. For instant help, check the FAQ or chat with us.",
    },
    {
      q: "Where can I check my subscription history?",
      a: "Go to My Account → Subscription History to view all past and current plans with details.",
    },
  ],
};

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState(Object.keys(faqData)[0]);
  const [openQuestion, setOpenQuestion] = useState(null);

  return (
    <div className="faq-page">
      <h1 className="faq-title">❓ Help & FAQs</h1>
      <div className="faq-container">
        {/* Sidebar */}
        <div className="faq-sidebar">
          <h3 className="sidebar-heading">Categories</h3>
          {Object.keys(faqData).map((category) => (
            <div
              key={category}
              className={`sidebar-item ${
                activeCategory === category ? "active" : ""
              }`}
              onClick={() => {
                setActiveCategory(category);
                setOpenQuestion(null);
              }}
            >
              {category}
            </div>
          ))}
        </div>

        {/* Questions */}
        <div className="faq-content">
          {faqData[activeCategory].map((item, index) => (
            <div
              key={index}
              className={`faq-item ${openQuestion === index ? "open" : ""}`}
            >
              <div
                className="faq-question"
                onClick={() =>
                  setOpenQuestion(openQuestion === index ? null : index)
                }
              >
                {item.q}
                <span className="faq-toggle">
                  {openQuestion === index ? "−" : "+"}
                </span>
              </div>
              {openQuestion === index && (
                <div className="faq-answer">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
