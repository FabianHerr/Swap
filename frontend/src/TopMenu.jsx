import React, { useState } from "react";

const TopMenu = () => {
  const [activeButton, setActiveButton] = useState("swap");

  const buttons = [
    { id: "swap", label: "Swap", icon: "⇅" },
    { id: "browse", label: "Browse Offers", icon: "🔍" },
    { id: "create", label: "Create Offer", icon: "➕" },
    { id: "messages", label: "Messages", icon: "💬" },
  ];

  const handleButtonClick = (id) => {
    setActiveButton(id);
    console.log(`Navigating to: ${id}`);
  };

  return (
    <div
      className="d-flex align-items-center shadow"
      style={{
        width: "100%",
        height: "60px",
        background: "linear-gradient(135deg, #4BAAFE 0%, #3da5fe 100%)",
        padding: "0 16px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Logo (far left) */}
      <div style={{ fontSize: "22px", color: "#fff", fontWeight: "700" }}>
        🌐
      </div>

      {/* Middle buttons */}
      <nav className="d-flex flex-grow-1 justify-content-center">
        {buttons.map((b) => (
          <button
            key={b.id}
            className={`btn d-flex align-items-center mx-2 ${
              activeButton === b.id ? "shadow" : ""
            }`}
            style={{
              justifyContent: "center",
              padding: "10px",
              borderRadius: "12px",
              background:
                activeButton === b.id
                  ? "rgba(255,255,255,0.25)"
                  : "rgba(255,255,255,0.1)",
              color: "#fff",
              fontWeight: 700,
              transition: "all 0.3s ease",
            }}
            onClick={() => handleButtonClick(b.id)}
          >
            <span style={{ fontSize: "20px" }}>{b.icon}</span>
          </button>
        ))}
      </nav>

      {/* Profile (far right) */}
      <button
        className={`btn d-flex align-items-center ${
          activeButton === "profile" ? "shadow" : ""
        }`}
        style={{
          justifyContent: "center",
          padding: "10px",
          borderRadius: "12px",
          background:
            activeButton === "profile"
              ? "rgba(255,255,255,0.25)"
              : "rgba(255,255,255,0.1)",
          color: "#fff",
          fontWeight: 700,
          transition: "all 0.3s ease",
        }}
        onClick={() => handleButtonClick("profile")}
      >
        <span style={{ fontSize: "20px" }}>👤</span>
      </button>
    </div>
  );
};

export default TopMenu;