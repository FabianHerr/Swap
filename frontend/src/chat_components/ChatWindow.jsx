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
  ];

  return (
    <div className="d-flex flex-column flex-grow-1" style={{height:'100vh', backgroundColor:'#f8f9fa'}}>
      <div className="d-flex align-items-center justify-content-between border-bottom sticky-top bg-white px-3" style={{height:'64px'}}>
        <div className="d-flex align-items-center">
          <div className="position-relative me-3" style={{width:'48px', height:'48px'}}>
            <img src="https://i.pravatar.cc/48?img=5" alt="User avatar" className="rounded-circle w-100 h-100" />
            <span className="position-absolute bottom-0 end-0" style={{width:'14px', height:'14px', backgroundColor:'#4BAAFE', borderRadius:'50%', border:'2px solid white'}}></span>
          </div>
          <div className="fw-bold text-dark">Alice</div>
        </div>
        <div>
          <Badge bg="primary" className="me-2">USD</Badge>
          <Badge bg="primary">CAD</Badge>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto p-3 bg-white">
        {messages.map(msg => <Message key={msg.id} message={msg} />)}
      </div>

      <Input />
    </div>
  );
};

export default ChatWindow;
