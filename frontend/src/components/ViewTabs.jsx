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
    <div role="tablist" className={`grid grid-cols-3 gap-1 p-1 rounded-full bg-surface-2 border border-line ${className}`}>
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
            className={`flex items-center justify-center gap-1 text-sm py-1.5 rounded-full cursor-pointer transition-colors ${
              active ? "bg-accent text-accent-fg font-medium shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            <TabIcon className={`w-4 h-4 shrink-0 max-[400px]:hidden ${badge > 0 ? "max-lg:hidden" : ""}`} />
            {label}
            {badge > 0 && (
              <span
                aria-label={`${badge} new`}
                className={`text-[11px] font-semibold min-w-[18px] h-[18px] px-1 flex justify-center items-center rounded-full ${
                  active ? "bg-accent-fg text-accent" : "bg-red-600 text-white"
                }`}
              >
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
