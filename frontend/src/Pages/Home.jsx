import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CSS/Home.css";

const Home = () => {
  const navigate = useNavigate();

  // Handle button click
  const handleGetStarted = (e) => {
    e.preventDefault(); // prevent default link jump
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard"); // if logged in → dashboard
    } else {
      navigate("/login"); // if not logged in → login
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome </h1>
          <p>Manage your broadband subscription with ease and flexibility.</p>
          <div className="hero-buttons">
            <Link to="/plans" className="btn-primary">
              View Plans
            </Link>
            <Link to="#" className="btn-secondary" onClick={handleGetStarted}>
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>99.9%</h3>
            <p>Uptime</p>
          </div>
          <div className="stat-card">
            <h3>500+</h3>
            <p>Enterprises</p>
          </div>
          <div className="stat-card">
            <h3>24/7</h3>
            <p>Support</p>
          </div>
          <div className="stat-card">
            <h3>ISO</h3>
            <p>Certified</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>⚡ Fast Internet</h3>
            <p>
              Enjoy blazing-fast connectivity with our premium broadband
              services.
            </p>
          </div>
          <div className="feature-card">
            <h3>💳 Easy Billing</h3>
            <p>
              Seamless payment options with detailed billing history at your
              fingertips.
            </p>
          </div>
          <div className="feature-card">
            <h3>📊 Smart Dashboard</h3>
            <p>Track your data usage and manage subscriptions in one place.</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <h2>Ready to Upgrade Your Internet?</h2>
        <p>Pick a plan that suits your needs and get connected today!</p>
        <Link to="/plans" className="btn-primary">
          Explore Plans
        </Link>
      </section>
    </div>
  );
};

export default Home;
