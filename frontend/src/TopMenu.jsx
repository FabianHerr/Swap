import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { PiListBold, PiPlusCircle, PiSignOut, PiSparkle, PiSparkleBold, PiSquaresFour, PiTray, PiX } from "react-icons/pi";
import logo from "./assets/logo.svg";
import api from "./api";
import { useAuth } from "./AuthContext";
import { Avatar, Count } from "./ui";
import { settle } from "./motion";
import AssistantPanel from "./AssistantPanel";

const POLL_MS = 15000;

const links = [
  { to: "/offers", label: "Offers", Icon: PiSquaresFour },
  { to: "/offer", label: "Post offer", Icon: PiPlusCircle },
  { to: "/requests", label: "Requests", Icon: PiTray, showsPending: true },
];

// Pending requests on your offers, kept fresh so a new request shows up without a reload
function usePendingCount(user) {
  const location = useLocation();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const refresh = () => {
      if (document.hidden) return;
      api.get("/requests/incoming")
        .then((res) => active && setPending(res.data.requests.filter((r) => r.status === "pending").length))
        .catch(() => {});
    };
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    window.addEventListener("swap:requests-changed", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("swap:requests-changed", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [user, location.pathname]);

  return user ? pending : 0;
}

const TopMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pending = usePendingCount(user);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // AssistantPanel saves document.activeElement (to refocus it on close) in an effect that runs
  // right after the DOM commits `open`. If the fab hid in that same commit, it would already be
  // blurred by the time that effect runs, so the panel would capture <body> instead of the fab.
  // fabSettledOpen only flips true a tick after assistantOpen does, so the fab is still mounted
  // (and still focused) when that capture happens. Closing reveals the fab immediately, in the
  // same render as assistantOpen going false however it closed (Escape, backdrop, the panel's
  // own close button, or Cmd/Ctrl+K), so the panel's restore-focus effect finds it already there.
  const [fabSettledOpen, setFabSettledOpen] = useState(false);
  const prevAssistantOpenRef = useRef(assistantOpen);
  if (prevAssistantOpenRef.current !== assistantOpen) {
    prevAssistantOpenRef.current = assistantOpen;
    if (!assistantOpen && fabSettledOpen) setFabSettledOpen(false);
  }
  useEffect(() => {
    if (assistantOpen) setFabSettledOpen(true);
  }, [assistantOpen]);
  const fabHidden = assistantOpen && fabSettledOpen;

  // A navigation, or the escape key, always closes the mobile drawer
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // The drawer's open state lives on .app so the CSS can react to it at any width
  useEffect(() => {
    document.querySelector(".app")?.classList.toggle("drawer-open", drawerOpen);
    return () => document.querySelector(".app")?.classList.remove("drawer-open");
  }, [drawerOpen]);

  // Cmd/Ctrl+K toggles the assistant from anywhere in the app shell, only while logged in.
  // Opening it closes the mobile drawer so the two overlays never fight for the screen.
  useEffect(() => {
    if (!user) return;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAssistantOpen((open) => {
          if (!open) setDrawerOpen(false);
          return !open;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user]);

  const openAssistant = () => {
    setDrawerOpen(false);
    setAssistantOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <aside className="sidebar">
        <div className="sidebar-top">
          <NavLink to="/login" className="sidebar-brand" aria-label="Swap home">
            <img src={logo} alt="Swap" />
          </NavLink>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-top">
          <NavLink to="/offers" className="sidebar-brand" aria-label="Swap home">
            <img src={logo} alt="Swap" />
          </NavLink>
          <button
            type="button"
            className="sidebar-menu-btn"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            {drawerOpen ? <PiX aria-hidden="true" /> : <PiListBold aria-hidden="true" />}
          </button>
        </div>

        <div className="sidebar-drawer">
          <nav className="sidebar-nav" aria-label="Main">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end className="sidebar-item">
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="sidebar-fill" className="sidebar-item-fill" transition={settle} />}
                    <link.Icon aria-hidden="true" />
                    <span>{link.label}</span>
                    {link.showsPending && <Count value={pending} label={`${pending} pending`} />}
                  </>
                )}
              </NavLink>
            ))}
            <button type="button" className="sidebar-item" onClick={openAssistant}>
              <PiSparkle aria-hidden="true" />
              <span>Ask Swap</span>
            </button>
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <Avatar name={user.name} size={28} />
              <span className="sidebar-user-name">{user.name}</span>
            </div>
            <button className="sidebar-logout" onClick={handleLogout} aria-label={`Log out ${user.name}`}>
              <PiSignOut aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
      <button
        type="button"
        className="sidebar-backdrop"
        aria-hidden={!drawerOpen}
        tabIndex={-1}
        onClick={() => setDrawerOpen(false)}
      />
      <button
        type="button"
        className="assistant-fab"
        hidden={fabHidden}
        aria-label="Ask Swap"
        title="Ask Swap (⌘K)"
        onClick={openAssistant}
      >
        <PiSparkleBold aria-hidden="true" />
      </button>
      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </>
  );
};

export default TopMenu;
