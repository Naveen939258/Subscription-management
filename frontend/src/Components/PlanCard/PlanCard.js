import React from "react";
import "./PlanCard.css"; // Import CSS

const PlanCard = ({ title, speed, price, description, onSelect }) => {
  return (
    <div className="plan-card">
      <h2 className="plan-title">{title}</h2>
      <p className="plan-detail">Speed: {speed}</p>
      <p className="plan-detail">Price: ₹{price}/month</p>
      <p className="plan-description">{description}</p>
      <button className="plan-button" onClick={onSelect}>
        Choose Plan
      </button>
    </div>
  );
};

export default PlanCard;