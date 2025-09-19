import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/LoginSignUp.css";

const LoginSignup = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const endpoint = isSignup ? "auth/register" : "auth/login";

      // Prepare payload based on backend schema
      const payload = isSignup
        ? { ...formData, isAdmin: false } // default user
        : { email: formData.email, password: formData.password };

      const res = await fetch(`https://subscription-management-bn9p.onrender.com/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`${isSignup ? "Signup" : "Login"} Successful ✅`);

        // Store JWT token and user info from backend
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        navigate("/"); // redirect to user home
        window.dispatchEvent(new Event("loginStatusChanged"));
      } else {
        setMessage(data.error || "Something went wrong ❌");
      }
    } catch (err) {
      setMessage("Server error ❌");
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>{isSignup ? "Sign Up" : "Login"}</h1>

        <div className="loginsignup-fields">
          {isSignup && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />

          {isSignup && (
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
            />
          )}
        </div>

        <button onClick={handleSubmit}>
          {isSignup ? "Sign Up" : "Login"}
        </button>

        <p className="loginsignup-toggle">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>

        {message && <p className="loginsignup-message">{message}</p>}
      </div>
    </div>
  );
};

export default LoginSignup;
