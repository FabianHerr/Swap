import logo from "./assets/logo.svg";
import React, { useState, useEffect } from "react";
import { FiSearch, FiPlusCircle, FiMessageCircle, FiUser } from "react-icons/fi";
import { FaSearch, FaPlusCircle, FaCommentDots, FaUser } from "react-icons/fa";

const TopMenu = () => {
  const [activeButton, setActiveButton] = useState("swap");
  const [hoveredButton, setHoveredButton] = useState(null);

  const buttons = [
    { id: "browse", label: "Browse Offers", iconEmpty: FiSearch, iconFilled: FaSearch },
    { id: "create", label: "Create Offer", iconEmpty: FiPlusCircle, iconFilled: FaPlusCircle },
    { id: "messages", label: "Messages", iconEmpty: FiMessageCircle, iconFilled: FaCommentDots },
  ];

  const handleButtonClick = (id) => {
    // Only navigate, don't setActiveButton here (will be set based on URL in useEffect)
    if (id === "create") {
      window.location.href = "/offer";
    } else if (id === "messages") {
      window.location.href = "/messages";
    }
    // No navigation for "browse" or "profile" in this logic
    console.log(`Navigating to: ${id}`);
  };

  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/offer") {
      setActiveButton("create");
    } else if (path === "/messages") {
      setActiveButton("messages");
    } else {
      setActiveButton("swap");
    }
  }, []);

  return (
    <div
      className="d-flex align-items-center shadow"
      style={{
        width: "100%",
        height: "60px",
        background: "linear-gradient(135deg, #4BAAFE 0%, #3da5fe 100%)",
        padding: "10px 16px",
        fontFamily: '"Rubik Bubbles", cursive',
      }}
    >
      {/* Logo (far left) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "40px",
          marginRight: "16px",
        }}
      >
        <img src={logo} alt="Logo" style={{ height: "40px", width: "auto", display: "block" }} />
      </div>

      {/* Middle buttons */}
      <nav className="d-flex flex-grow-1 justify-content-center">
        {buttons.map((b) => {
          const Icon = activeButton === b.id ? b.iconFilled : b.iconEmpty;
          const isActive = activeButton === b.id;
          const isHovered = hoveredButton === b.id;
          return (
            <button
              key={b.id}
              className={`btn d-flex align-items-center mx-2 ${isActive ? "shadow" : ""}`}
              style={{
                justifyContent: "center",
                padding: "11px 48px",
                borderRadius: "12px",
                background: isHovered ? "#a0d8ff" : "transparent",
                color: isActive ? "#fc65b3" : "#fff",
                fontWeight: 700,
                transition: "all 0.3s ease",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => handleButtonClick(b.id)}
              onMouseEnter={() => setHoveredButton(b.id)}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <Icon size={28} />
            </button>
          );
        })}
      </nav>

      {/* Profile (far right) */}
      <button
        className={`btn d-flex align-items-center ${activeButton === "profile" ? "shadow" : ""}`}
        style={{
          justifyContent: "center",
          padding: "14px 28px",
          borderRadius: "12px",
          background: hoveredButton === "profile" ? "#a0d8ff" : "transparent",
          color: activeButton === "profile" ? "#fc65b3" : "#fff",
          fontWeight: 700,
          transition: "all 0.3s ease",
          border: "none",
          cursor: "pointer",
        }}
        onClick={() => handleButtonClick("profile")}
        onMouseEnter={() => setHoveredButton("profile")}
        onMouseLeave={() => setHoveredButton(null)}
      >
        {activeButton === "profile" ? <FaUser size={28} /> : <FiUser size={28} />}
      </button>
    </div>
  );
};

export default TopMenu;