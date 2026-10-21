import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import { ChatContext } from "../../context/ChatContext";

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);

  return (
    // Fills the whole browser window. Phones show one panel at a time,
    // tablets show list + chat, large screens add the profile panel.
    <div className="w-full h-dvh overflow-hidden">
      <div
        className={`backdrop-blur-xl h-full grid grid-cols-1 relative ${
          selectedUser
            ? "md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr_320px]"
            : "md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr]"
        }`}
      >
        <Sidebar />
        <ChatContainer />
        <RightSidebar />
      </div>
    </div>
  );
};

export default HomePage;
