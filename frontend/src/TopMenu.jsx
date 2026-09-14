import logo from "./assets/logo.svg";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiSearch, FiPlusCircle, FiInbox, FiLogOut } from "react-icons/fi";
import { FaSearch, FaPlusCircle, FaInbox } from "react-icons/fa";
import { useAuth } from "./AuthContext";

const links = [
  { to: "/offers", label: "Browse offers", iconEmpty: FiSearch, iconFilled: FaSearch },
  { to: "/offer", label: "Create offer", iconEmpty: FiPlusCircle, iconFilled: FaPlusCircle },
  { to: "/requests", label: "Swap requests", iconEmpty: FiInbox, iconFilled: FaInbox },
];

const TopMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hoveredButton, setHoveredButton] = useState(null);

  const buttonStyle = (id, isActive, padding) => ({
    justifyContent: "center",
    padding,
    borderRadius: "12px",
    background: hoveredButton === id ? "#a0d8ff" : "transparent",
    color: isActive ? "#fc65b3" : "#fff",
    fontWeight: 700,
    transition: "all 0.3s ease",
    border: "none",
    cursor: "pointer",
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
        <img src={logo} alt="Swap" style={{ height: "40px", width: "auto", display: "block" }} />
      </div>

      {/* Navigation only makes sense once logged in */}
      {user && (
        <>
          {/* Middle buttons */}
          <nav className="d-flex flex-grow-1 justify-content-center">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                title={link.label}
                aria-label={link.label}
                className={({ isActive }) => `btn d-flex align-items-center mx-2 ${isActive ? "shadow" : ""}`}
                style={({ isActive }) => buttonStyle(link.to, isActive, "11px 48px")}
                onMouseEnter={() => setHoveredButton(link.to)}
                onMouseLeave={() => setHoveredButton(null)}
              >
                {({ isActive }) => {
                  const Icon = isActive ? link.iconFilled : link.iconEmpty;
                  return <Icon size={28} />;
                }}
              </NavLink>
            ))}
          </nav>

          {/* Logout (far right) */}
          <button
            className="btn d-flex align-items-center gap-2"
            style={buttonStyle("logout", false, "14px 20px")}
            title={`Log out ${user.name}`}
            aria-label="Log out"
            onClick={handleLogout}
            onMouseEnter={() => setHoveredButton("logout")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <span className="small" style={{ fontFamily: "system-ui, sans-serif" }}>{user.name}</span>
            <FiLogOut size={24} />
          </button>
        </>
      )}
    </div>
  );
};

export default TopMenu;
