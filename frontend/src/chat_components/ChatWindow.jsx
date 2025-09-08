import React from 'react';
import Message from './Message';
import Input from './Input';
import { Badge } from 'react-bootstrap';

const ChatWindow = () => {
  const messages = [
    { id: 1, text: 'Hey! Are you still selling USD?', sender: 'them' },
    { id: 2, text: 'Yes! How much do you need?', sender: 'me' },
    { id: 3, text: 'About 200, exchanging to CAD.', sender: 'them' },
    { id: 4, text: 'Perfect, I can do that.', sender: 'me' },
    { id: 5, text: 'What\'s your rate today?', sender: 'them' },
    { id: 6, text: '1.35 CAD for 1 USD. Does that work?', sender: 'me' },
    { id: 7, text: 'Sounds good! When can we meet?', sender: 'them' },
    { id: 8, text: 'I\'m free this afternoon around 3 PM.', sender: 'me' },
  ];

  return (
    <div className="d-flex flex-column" style={{ height: '100vh' }}>
      {/* Header - Fixed */}
      <div 
        className="d-flex align-items-center justify-content-between border-bottom bg-white px-3 shadow-sm"
        style={{ height: '70px', flexShrink: 0 }}
      >
        <div className="d-flex align-items-center">
          <div className="position-relative me-3" style={{ width: '44px', height: '44px' }}>
            <img
              src="https://i.pravatar.cc/44?img=5"
              alt="Alice"
              className="rounded-circle w-100 h-100"
              style={{ objectFit: 'cover' }}
            />
            <div
              className="position-absolute bottom-0 end-0 bg-success border-2 border-white rounded-circle"
              style={{ width: '14px', height: '14px' }}
            ></div>
          </div>
          <div>
            <div className="fw-semibold text-dark mb-0">Alice</div>
            <div className="text-muted small">Online</div>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Badge bg="primary" pill>USD</Badge>
          <Badge bg="success" pill>CAD</Badge>
        </div>
      </div>

      {/* Messages Area - Scrollable, takes remaining height */}
      <div 
        className="flex-grow-1 overflow-auto bg-light"
        style={{ minHeight: 0 }}
      >
        <div className="p-3">
          {messages.map(msg => (
            <Message key={msg.id} message={msg} />
          ))}
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div 
        className="bg-white border-top shadow-sm"
        style={{ flexShrink: 0 }}
      >
        <div className="p-3">
          <Input />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;