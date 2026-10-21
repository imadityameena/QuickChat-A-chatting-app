import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import DiscoverView from "../components/DiscoverView";
import RequestsView from "../components/RequestsView";
import ProfileModal from "../components/ProfileModal";
import { ChatContext } from "../../context/ChatContext";

const HomePage = () => {
  const { selectedUser, view } = useContext(ChatContext);

  return (
    // Fills the whole browser window. Phones show one panel at a time,
    // tablets show list + chat, large screens add the profile panel.
    <div className="w-full h-dvh overflow-hidden">
      <div
        className={`backdrop-blur-xl h-full grid grid-cols-1 relative ${
          view === "chats" && selectedUser
            ? "md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr_320px]"
            : "md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr]"
        }`}
      >
        <Sidebar />
        {view === "discover" && <DiscoverView />}
        {view === "requests" && <RequestsView />}
        {view === "chats" && (
          <>
            <ChatContainer />
            <RightSidebar />
          </>
        )}
      </div>
      <ProfileModal />
    </div>
  );
};

export default HomePage;
