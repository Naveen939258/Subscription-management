// src/pages/LocateUs.jsx
import React, { useState } from "react";
import "./CSS/LocateUs.css";

// Static store data
const storeData = {
  Hyderabad: [
    { name: "Subscription Store - Ameerpet", address: "Ameerpet, Hyderabad" },
    { name: "Subscription Service Center - Begumpet", address: "Begumpet, Hyderabad" },
  ],
  Chennai: [
    { name: "Subscription Store - T Nagar", address: "T Nagar, Chennai" },
    { name: "Subscription Hotspot - Anna Nagar", address: "Anna Nagar, Chennai" },
  ],
  Bangalore: [
    { name: "Subscription Store - MG Road", address: "MG Road, Bangalore" },
    { name: "Subscription Service Center - Whitefield", address: "Whitefield, Bangalore" },
  ],
  Vijayawada: [
    { name: "Subscription Store - Benz Circle", address: "Benz Circle, Vijayawada" },
    { name: "Subscription Service Center - Governorpet", address: "Governorpet, Vijayawada" },
  ],
  Vizag: [
    { name: "Subscription Store - MVP Colony", address: "MVP Colony, Visakhapatnam" },
    { name: "Subscription Hotspot - Gajuwaka", address: "Gajuwaka, Visakhapatnam" },
  ],
  Rajahmundry: [
    { name: "Subscription Store - Main Road", address: "Main Road, Rajahmundry" },
    { name: "Subscription Service Center - Kotipalli Bus Stand", address: "Kotipalli, Rajahmundry" },
  ],
  Kakinada: [
    { name: "Subscription Store - Bhanugudi Junction", address: "Bhanugudi Junction, Kakinada" },
    { name: "Subscription Service Center - Jagannaickpur", address: "Jagannaickpur, Kakinada" },
  ],
};

const LocateUs = () => {
  const [activeTab, setActiveTab] = useState("stores");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [mapSrc, setMapSrc] = useState("https://www.google.com/maps?q=Rajahmundry&output=embed"); // default Rajahmundry

  const handleSearch = (e) => {
    const value = e.target.value.trim();
    setQuery(value);

    if (!value) {
      setResults([]);
      setMapSrc("https://www.google.com/maps?q=Rajahmundry&output=embed");
      return;
    }

    // ✅ Partial match (case-insensitive)
    const matchedCity = Object.keys(storeData).find((city) =>
      city.toLowerCase().startsWith(value.toLowerCase())
    );

    if (matchedCity) {
      setResults(storeData[matchedCity]);
      setMapSrc(`https://www.google.com/maps?q=${matchedCity}&output=embed`);
    } else {
      setResults([]);
      setMapSrc("https://www.google.com/maps?q=Rajahmundry&output=embed"); // fallback
    }
  };

  return (
    <div className="locate-page">
      <h1 className="locate-title">📍 Locate Us</h1>

      {/* Search Bar */}
      <div className="locate-search">
        <input
          type="text"
          placeholder="Enter your city (e.g., Hyderabad, Chennai)"
          value={query}
          onChange={handleSearch}
        />
      </div>

      {/* Tabs */}
      <div className="locate-tabs">
        <button
          className={activeTab === "stores" ? "active" : ""}
          onClick={() => setActiveTab("stores")}
        >
          Stores
        </button>
        <button
          className={activeTab === "service" ? "active" : ""}
          onClick={() => setActiveTab("service")}
        >
          Service Centers
        </button>
        <button
          className={activeTab === "hotspots" ? "active" : ""}
          onClick={() => setActiveTab("hotspots")}
        >
          Hotspots
        </button>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="locate-results">
          <h3>Results in {query}:</h3>
          <ul>
            {results.map((item, index) => (
              <li key={index}>
                <strong>{item.name}</strong>
                <p>{item.address}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dynamic Map */}
      <div className="locate-map">
        <iframe
          title="google-map"
          src={mapSrc}
          width="100%"
          height="400"
          style={{ border: "0", borderRadius: "10px" }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>

      <p className="locate-note">
        Please turn on location-sharing or type your city in the search bar to find our nearest
        stores, service centers, and hotspots.
      </p>
    </div>
  );
};

export default LocateUs;
