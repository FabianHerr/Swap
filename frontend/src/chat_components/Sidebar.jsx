import React, { useState } from "react";
import Navbar from './Navbar';
import Search from './Search';
import ChatList from './ChatList';

const Sidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className={`d-flex flex-column vh-100 bg-white`} style={{minWidth: '320px', maxWidth: '360px'}}>
      <Navbar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <Search />
      <ChatList />
    </div>
  );
};

export default Sidebar;