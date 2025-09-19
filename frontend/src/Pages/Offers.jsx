import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CSS/Offers.css";

const Offers = () => {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await axios.get("https://subscription-management-bn9p.onrender.com/api/discounts");
      // Only active offers
      setOffers(res.data.filter((o) => o.isActive));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="offers-page">
      <h1 className="offers-title">
  <span className="gradient-text">Exclusive Offers</span> 🎉
</h1>

      <p className="offers-subtitle">Get the best deals and discounts on your broadband plans.</p>

      <div className="offers-container">
        {offers.length > 0 ? (
          offers.map((offer) => (
            <div key={offer._id} className="offer-card">
              <h2>
                {offer.type === "percentage" ? (
                  <>
                    🔥 {offer.value}% Off
                  </>
                ) : (
                  <>
                    💰 ₹{offer.value} Off
                  </>
                )}
              </h2>
              <p>{offer.title}</p>
              {offer.description && <small>{offer.description}</small>}
              <div className="offer-code">Code: {offer.code}</div>
            </div>
          ))
        ) : (
          <p>No active offers available</p>
        )}
      </div>
    </div>
  );
};

export default Offers;
