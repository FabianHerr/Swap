import React from "react";
import Sidebar from "./chat_components/Sidebar";
import ChatWindow from "./chat_components/ChatWindow";
import "bootstrap/dist/css/bootstrap.min.css";

const Messages = () => {
  return (
    <div className="d-flex" style={{ height: "100vh" }}>
      {/* Sidebar */}
      <div className="d-none d-md-block" style={{ width: "320px" }}>
        <Sidebar />
      </div>

      {/* Chat window */}
      <div className="flex-grow-1">
        <ChatWindow />
      </div>
    </div>
  );
};

export default Messages; 