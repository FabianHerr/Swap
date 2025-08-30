import React from 'react';
import { Card } from 'react-bootstrap';

const Message = ({ message }) => (
  <div className={`d-flex mb-3 ${message.sender==='me'?'justify-content-end':'justify-content-start'}`}>
    <Card bg={message.sender==='me'?'primary':'light'} text={message.sender==='me'?'white':'dark'} className="p-2 rounded-3" style={{maxWidth:'70%'}}>
      {message.text}
    </Card>
  </div>
);

export default Message;