import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faFacebook,
  faLinkedin,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import "./Footer.css";

const Footer = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const handleLoginStatusChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    handleLoginStatusChange();
    window.addEventListener("loginStatusChanged", handleLoginStatusChange);

    return () => {
      window.removeEventListener("loginStatusChanged", handleLoginStatusChange);
    };
  }, []);

  return (
    <footer className="footer">
      <div className="footer-sections">
        {/* Our Offerings */}
        <div className="footer-column">
          <h2>Our Offerings</h2>
          <ul>
            <li><Link to="/plans">Plans</Link></li>
            <li><Link to="/offers">Offers</Link></li>
            {isLoggedIn ? (
              <li><Link to="/connection">Connections</Link></li>
            ) : (
              <li><Link to="/login">Connections</Link></li>
            )}
          </ul>
        </div>

        {/* Support */}
        <div className="footer-column">
          <h2>Support</h2>
          <ul>
            {isLoggedIn ? (
              <li><Link to="/profile">My Account</Link></li>
            ) : (
              <li><Link to="/login">My Account</Link></li>
            )}
            <li><Link to="/locateus">Locate Us</Link></li>
            <li><Link to="/feedback">Feedback</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div className="footer-column">
          <h2>Company</h2>
          <ul>
            <li><Link to="/">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Useful Links */}
        <div className="footer-column">
          <h2>Useful Links</h2>
          <ul>
            <li><Link to="/offers">Store Packs</Link></li>
            {isLoggedIn ? (
              <li><Link to="/connection">Coverage Map</Link></li>
            ) : (
              <li><Link to="/login">Coverage Map</Link></li>
            )}
            <li><Link to="/">Sitemap</Link></li>
          </ul>
        </div>
      </div>

      {/* Social + Branding */}
      <div className="footer-bottom">
        <div className="social-icons">
          <a
            href="https://www.instagram.com/accounts/login/?hl=en"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faFacebook} />
          </a>
          <a
            href="https://www.linkedin.com/in/kakarla-naveen-2092411b3/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faLinkedin} />
          </a>
          <a href="https://wa.me/919392589802" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faWhatsapp} />
          </a>
        </div>

        <p>&copy; {new Date().getFullYear()} Subscription. All Rights Reserved.</p>
        <p className="sub-text">Broadband Subscription Management System</p>
      </div>
    </footer>
  );
};

export default Footer;
