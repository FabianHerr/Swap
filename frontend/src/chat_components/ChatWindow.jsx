import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const ChatWindow = () => {
  const messages = [
    { id: 1, text: "Hey! Are you still selling USD?", sender: "them" },
    { id: 2, text: "Yes! How much do you need?", sender: "me" },
    { id: 3, text: "About 200, exchanging to CAD.", sender: "them" },
    { id: 4, text: "Perfect, I can do that.", sender: "me" },
  ];

  return (
    <div
      className="d-flex flex-column flex-grow-1"
      style={{ height: "100vh", backgroundColor: "#f9fafc" }}
    >
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-white">
        <div className="d-flex align-items-center">
          <img
            src="https://i.pravatar.cc/40?img=5"
            alt="User avatar"
            className="rounded-circle me-2"
            width="40"
            height="40"
          />
          <div>
            <div className="fw-semibold">Alice</div>
            <small className="text-success">● Online</small>
          </div>
        </div>
        <div>
          <span className="badge bg-primary me-1">USD</span>
          <span className="badge bg-success">CAD</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow-1 overflow-auto p-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`d-flex mb-3 ${
              msg.sender === "me" ? "justify-content-end" : "justify-content-start"
            }`}
          >
            <div
              className={`p-2 rounded-3 shadow-sm ${
                msg.sender === "me"
                  ? "bg-gradient text-white"
                  : "bg-white text-dark"
              }`}
              style={{
                maxWidth: "70%",
                background:
                  msg.sender === "me"
                    ? "linear-gradient(90deg, #4BAAFE, #FC65B3)"
                    : "white",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-top bg-white">
        <div className="input-group">
          <input
            type="text"
            className="form-control rounded-pill"
            placeholder="Type a message..."
          />
          <button
            className="btn ms-2"
            style={{
              background: "#FC65B3",
              color: "white",
              borderRadius: "50%",
              width: "44px",
              height: "44px",
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;