import React from 'react';
import { InputGroup, FormControl, Button } from 'react-bootstrap';

const Input = () => (
  <div className="p-3 border-top bg-white">
    <InputGroup>
      <FormControl placeholder="Type a message..." className="rounded-pill" style={{backgroundColor:'#f9fafc', border:'none'}} />
      <Button className="ms-2 d-flex align-items-center justify-content-center rounded-circle" style={{width:'44px', height:'44px', backgroundColor:'#4BAAFE', border:'none'}}>&#10148;</Button>
    </InputGroup>
  </div>
);

export default Input;