import React from "react";
import Sidebar from "./chat_components/Sidebar";
import ChatWindow from "./chat_components/ChatWindow";

const Messages = () => {
    return(
        <div className = "Messages">
            <div className = "container">
                <Sidebar />
                <ChatWindow />
            </div>
        </div>

    )
}


export default Messages;