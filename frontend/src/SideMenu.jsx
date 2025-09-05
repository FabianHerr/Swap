import React, { useState, useEffect } from "react";

const SideMenu = () => {
  const [activeButton, setActiveButton] = useState("swap"); // know which button is active
  const [isCollapsed, setIsCollapsed] = useState(false); // know if the sidebar is collapsed or not
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);// know if we are on mobile or on desktop

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize); 
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const buttons = [
    { id: "swap", label: "Swap", icon: "⇅" },
    { id: "browse", label: "Browse Offers", icon: "🔍" },
    { id: "create", label: "Create Offer", icon: "➕" },
    { id: "messages", label: "Messages", icon: "💬" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  const handleButtonClick = (id) => {
    setActiveButton(id);
    console.log(`Navigating to: ${id}`);
  };

  const sidebarWidth = isCollapsed ? "80px" : "280px";

  return (
    <div
      className="d-flex flex-column vh-100 shadow"
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        transition: "width 0.3s ease",
        fontFamily: "Arial, sans-serif",
        background: "linear-gradient(135deg, #4BAAFE 0%, #3da5fe 100%)",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        overflow: "hidden",
        alignItems: isCollapsed ? "center" : "stretch",
      }}
    >
      {/* Collapse toggle button */}
      <button
        className="btn m-2 rounded d-flex align-items-center justify-content-center"
        style={{
          width: "40px",
          height: "40px",
          background: "#FC65B3",
          color: "#fff",
          fontWeight: "700",
          fontSize: "20px",
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {/* Hamburger icon (3 lines) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ width: "20px", height: "2px", background: "white", display: "block" }} />
          <span style={{ width: "20px", height: "2px", background: "white", display: "block" }} />
          <span style={{ width: "20px", height: "2px", background: "white", display: "block" }} />
        </div>
      </button>

      {/* Menu buttons */}
      <nav className="flex-grow-1 d-flex flex-column align-items-stretch">
        {buttons.map((b) => (
          <button
            key={b.id}
            className={`btn d-flex align-items-center mb-2 ${activeButton === b.id ? "shadow" : ""}`}
            style={{
              justifyContent: isCollapsed ? "center" : "flex-start",
              gap: "12px",
              padding: isCollapsed ? "12px 0" : "12px 16px",
              borderRadius: "16px",
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
            <span style={{ fontSize: "18px" }}>{b.icon}</span>
            {!isCollapsed && <span>{b.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default SideMenu;