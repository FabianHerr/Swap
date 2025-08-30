import React from 'react';
import { InputGroup, FormControl } from 'react-bootstrap';

const Search = () => (
  <InputGroup className="p-3 border-bottom">
    <FormControl placeholder="Search conversations..." className="rounded-pill" />
  </InputGroup>
);

export default Search;