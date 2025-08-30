import React from 'react';
import Sidebar from './chat_components/Sidebar';
import ChatWindow from './chat_components/ChatWindow';

const Messages = () => (
  <div className="d-flex vh-100">
    <div className="flex-shrink-0 shadow-sm border-end" style={{minWidth:'320px', maxWidth:'360px', zIndex:1}}>
      <Sidebar />
    </div>
    <div className="flex-grow-1 position-relative">
      <ChatWindow />
    </div>
  </div>
);

export default Messages;
