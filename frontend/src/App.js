import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Footer from "./Components/Footer/Footer";
import Navbar from "./Components/Navbar/Navbar";

import Home from "./Pages/Home";
import LoginSignup from "./Pages/LoginSignUp";
import Plans from "./Pages/Plans";
import Dashboard from "./Pages/Dashboard";
import Billing from "./Pages/Billing";
import Profile from "./Pages/Profile";
import Offers from "./Pages/Offers";
import SubscribePage from "./Pages/SubscribePage";
import SubscriptionHistory from "./Pages/SubscriptionHistory";
import Connections from "./Pages/Connections";
import Contact from "./Pages/Contact";
import FAQ from "./Pages/FAQ";
import LocateUs from "./Pages/LocateUs";
import Feedback from "./Pages/Feedback";

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Navbar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginSignup />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/offers" element={<Offers />} />
             <Route path="/subscribe/:planId" element={<SubscribePage />} />
             <Route path="/Subscriptionhistory" element={<SubscriptionHistory/>}/>
             <Route path="/connection" element={<Connections/>}/>

              <Route path="/contact" element={<Contact/>} />
            <Route path="/faq" element={<FAQ/>} />
            <Route path="/locateus" element={<LocateUs/>}/>
            <Route path="/feedback" element={<Feedback/>}/>
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}


export default App;
