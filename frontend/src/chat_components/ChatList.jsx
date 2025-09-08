// ChatList.jsx 
import React from 'react';

const conversations = [
  { id: 1, name: 'Alice', avatar: 'https://i.pravatar.cc/40?img=1', lastMessage: 'Hey! How much for 200 USD?', time: '10:24 AM', currencyPair: 'USD/CAD', online: true },
  { id: 2, name: 'Ben', avatar: 'https://i.pravatar.cc/40?img=2', lastMessage: 'Sure, I can meet today.', time: 'Yesterday', currencyPair: 'EUR/USD', online: false },
  { id: 3, name: 'Clara', avatar: 'https://i.pravatar.cc/40?img=3', lastMessage: 'I’ll bring CAD cash.', time: 'Mon', currencyPair: 'CAD/USD', online: true }
];

const ChatList = () => (
  <div className="flex-grow-1 overflow-auto list-group">
    {conversations.map((conv) => (
      <div key={conv.id} className="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <div className="position-relative me-3">
            <img src={conv.avatar} alt={conv.name} className="rounded-circle" style={{width:'48px', height:'48px', border: conv.online ? '2px solid #4BAAFE' : '2px solid #e6e6e6'}} />
          </div>
          <div>
            <div className="d-flex align-items-center mb-1">
              <span className="fw-bold text-dark me-2">{conv.name}</span>
              {conv.currencyPair && <span className="badge bg-primary rounded-pill" style={{ fontSize:'0.75rem', fontWeight:'700', letterSpacing:'0.5px' }}>{conv.currencyPair}</span>}
            </div>
            <div className="text-muted small">{conv.lastMessage}</div>
          </div>
        </div>
        <div className="small text-muted ms-2">{conv.time}</div>
      </div>
    ))}
  </div>
);

export default ChatList;

