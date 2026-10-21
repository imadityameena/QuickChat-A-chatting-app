import React, { useContext } from "react";
import { ChatContext } from "../../context/ChatContext";
import { FriendContext } from "../../context/FriendContext";
import { ChatIcon, CompassIcon, InboxIcon } from "./icons";

const TABS = [
  { id: "chats", label: "Chats", Icon: ChatIcon },
  { id: "discover", label: "Discover", Icon: CompassIcon },
  { id: "requests", label: "Requests", Icon: InboxIcon },
];

// Switch between Chats, Discover and Requests (with unread / request badges)
const ViewTabs = ({ className = "" }) => {
  const { view, setView, unseenMessages } = useContext(ChatContext);
  const { incoming } = useContext(FriendContext);
  const totalUnseen = Object.values(unseenMessages).reduce((sum, n) => sum + n, 0);

  return (
    <div role="tablist" className={`grid grid-cols-3 gap-1 p-1 rounded-full bg-[#282142] ${className}`}>
      {TABS.map((tab) => {
        const { id, label } = tab;
        const TabIcon = tab.Icon;
        const badge = id === "requests" ? incoming.length : id === "chats" ? totalUnseen : 0;
        const active = view === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setView(id)}
            className={`relative flex items-center justify-center gap-1.5 text-xs py-2 rounded-full cursor-pointer transition-colors ${
              active ? "bg-violet-600 text-white shadow-sm" : "text-gray-300 hover:text-white"
            }`}
          >
            <TabIcon className="w-3.5 h-3.5" />
            {label}
            {badge > 0 && (
              <span className="absolute -top-1 -right-0.5 text-[10px] min-w-4 h-4 px-1 flex justify-center items-center rounded-full bg-red-500 text-white">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ViewTabs;
