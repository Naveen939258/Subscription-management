// src/pages/Feedback.jsx
import React, { useState } from "react";
import axios from "axios";
import "./CSS/Feedback.css";

const Feedback = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // API call to save feedback
      await axios.post("https://subscription-management-bn9p.onrender.com/api/feedback", {
        name,
        email,
        feedback,
        rating,
      });

      alert("✅ Thanks for your feedback! Saved successfully.");

      // Reset form
      setName("");
      setEmail("");
      setFeedback("");
      setRating(0);
      setHover(0);
    } catch (error) {
      console.error("❌ Error saving feedback:", error);
      alert("⚠️ Failed to save feedback. Try again later.");
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-card">
        <h1 className="feedback-title">We'd love to hear from you</h1>
        <p className="feedback-subtitle">
          Take a quick survey about your experience. <br />
          (<span className="required">*</span>) Represents Mandatory Fields
        </p>

        <form className="feedback-form" onSubmit={handleSubmit}>
          <label>
            Name <span className="required">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>
            Email ID <span className="required">*</span>
          </label>
          <input
            type="email"
            placeholder="Enter email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>
            Feedback <span className="required">*</span>
          </label>
          <textarea
            rows="5"
            placeholder="Enter your feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required
          ></textarea>

          {/* ⭐ Star Rating */}
          <div className="rating">
            <label>Rate Us: </label>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= (hover || rating) ? "active" : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(rating)}
              >
                ★
              </span>
            ))}
          </div>

          <button type="submit" className="btn-submit">
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
