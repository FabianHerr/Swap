import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Sidebar.css";

const Sidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const conversations = [
    {
      id: 1,
      name: "Alice",
      avatar: "https://i.pravatar.cc/40?img=1",
      lastMessage: "Hey! How much for 200 USD?",
      time: "10:24 AM",
      currencyPair: "USD/CAD",
      online: true,
    },
    {
      id: 2,
      name: "Ben",
      avatar: "https://i.pravatar.cc/40?img=2",
      lastMessage: "Sure, I can meet today.",
      time: "Yesterday",
      currencyPair: "EUR/USD",
      online: false,
    },
    {
      id: 3,
      name: "Clara",
      avatar: "https://i.pravatar.cc/40?img=3",
      lastMessage: "I’ll bring CAD cash.",
      time: "Mon",
      currencyPair: "CAD/USD",
      online: true,
    },
  ];

  return (
    <div className="messages-container">
      <div className="messages-bg-elements"></div>

      {/* Mobile toggle button */}
      <button
        className="mobile-toggle-btn"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle conversations"
      >
        &#9776;
      </button>

      <div className={`sidebar ${isMobileOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="conversations-header d-flex justify-content-between align-items-center p-3 border-bottom bg-white">
          <h5 className="mb-0">Conversations</h5>
          <button className="btn btn-primary btn-sm">+ New Chat</button>
        </div>

        {/* Conversations list */}
        <div className="conversations-list overflow-auto">
          {conversations.map((conv) => (
            <div key={conv.id} className="conversation-item d-flex p-3 border-bottom">
              <div className="avatar-wrapper position-relative me-3">
                <img
                  src={conv.avatar}
                  alt={conv.name}
                  className="rounded-circle"
                  width="40"
                  height="40"
                />
                {conv.online && (
                  <span className="online-indicator position-absolute top-0 start-100 translate-middle"></span>
                )}
              </div>
              <div className="flex-grow-1 d-flex flex-column justify-content-center">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-semibold">{conv.name}</span>
                  <small className="text-muted">{conv.time}</small>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">{conv.currencyPair}</small>
                  <small className="text-truncate text-muted ms-2">
                    {conv.lastMessage}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;