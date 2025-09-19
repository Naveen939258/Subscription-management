// src/pages/Contact.jsx
import React, { useState } from "react";
import "./CSS/Contact.css";

const Contact = () => {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="contact-page">
      {/* Page Title */}
      <h1 className="contact-title">Connect with us</h1>

      {/* Tabs */}
      <div className="contact-tabs">
        <button
          className={activeTab === "chat" ? "active" : ""}
          onClick={() => setActiveTab("chat")}
        >
          💬 Chat
        </button>
        <button
          className={activeTab === "email" ? "active" : ""}
          onClick={() => setActiveTab("email")}
        >
          📧 Email
        </button>
        <button
          className={activeTab === "call" ? "active" : ""}
          onClick={() => setActiveTab("call")}
        >
          📞 Call
        </button>
      </div>

      {/* Content */}
      <div className="contact-content">
        {activeTab === "chat" && (
          <div className="contact-box">
            <h3>Reach out on WhatsApp</h3>
            <p>
              Mobile Support:{" "}
              <a href="https://wa.me/919392589802" target="_blank" rel="noreferrer">
               <b> 9392589802</b>
              </a>
            </p>
            <p>
              Broadband Support:{" "}
              <a href="https://wa.me/9494660770" target="_blank" rel="noreferrer">
                <b>9494660770</b>
              </a>
            </p>
          </div>
        )}

        {activeTab === "email" && (
          <div className="contact-box">
            <h3>Email Us</h3>
            <p>
              General Support:{" "}
              <a href="mailto:naveenkakarla4@gmail.com">
               <b>naveenkakarla4@gmail.com</b> 
              </a>
            </p>
            <p>
              Billing Queries:{" "}
              <a href="mailto:billing@subscription.com">
                <b>billing@subscription.com</b>
              </a>
            </p>
          </div>
        )}

        {activeTab === "call" && (
          <div className="contact-box">
            <h3>Call Us</h3>
            <p>Customer Care: <b>1800-123-456</b></p>
            <p>Billing Support: <b>1800-654-321</b></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
