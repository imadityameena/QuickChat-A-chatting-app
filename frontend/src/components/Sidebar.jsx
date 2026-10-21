import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import { FriendContext } from "../../context/FriendContext";
import { formatSidebarTime } from "../lib/utils";
import DiscoverPanel from "./DiscoverPanel";
import RequestsPanel from "./RequestsPanel";

const TABS = ["Chats", "Discover", "Requests"];

const Sidebar = () => {
  const { users, selectedUser, selectUser, unseenMessages, typingUsers } = useContext(ChatContext);
  const { logout, onlineUsers, authUser } = useContext(AuthContext);
  const { incoming } = useContext(FriendContext);

  const [tab, setTab] = useState("Chats");
  const [search, setSearch] = useState("");
  const [notifPermission, setNotifPermission] = useState(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close the menu when clicking anywhere else
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const query = search.trim().toLowerCase();
  const filteredUsers = query
    ? users.filter(
        (user) =>
          user.fullName.toLowerCase().includes(query) ||
          user.username?.includes(query.replace(/^@/, ""))
      )
    : users;

  const totalUnseen = Object.values(unseenMessages).reduce((sum, n) => sum + n, 0);

  // Jump from Discover/Requests straight into a chat with a new friend
  const openChat = (user) => {
    setTab("Chats");
    selectUser(user);
  };

  const enableNotifications = async () => {
    setMenuOpen(false);
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  const previewText = (user) => {
    if (typingUsers[user._id]) return <span className="text-violet-300">typing…</span>;
    const last = user.lastMessage;
    if (!last) return onlineUsers.includes(user._id) ? "Online" : "Offline";
    const prefix = last.senderId === authUser._id ? "You: " : "";
    return prefix + (last.image && !last.text ? "📷 Photo" : last.text);
  };

  return (
    <div
      className={`bg-[#8185B2]/10 h-full min-h-0 flex flex-col p-4 sm:p-5 pb-0 sm:pb-0 pt-[max(1rem,env(safe-area-inset-top))] md:border-r border-white/10 text-white ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >
      <div className="pb-4 shrink-0">
        <div className="flex justify-between items-center">
          <img src={assets.logo} alt="QuickChat" className="max-w-40" />
          <div className="relative py-2" ref={menuRef}>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="cursor-pointer p-1"
            >
              <img src={assets.menu_icon} alt="" className="max-h-5" />
            </button>
            {menuOpen && (
              <div className="absolute top-full right-0 z-20 w-36 p-4 rounded-md bg-[#282142] border border-gray-600 text-gray-100 shadow-lg">
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="block w-full text-left cursor-pointer text-sm hover:text-violet-300"
                >
                  Edit Profile
                </button>
                {notifPermission === "default" && (
                  <>
                    <hr className="my-2 border-t border-gray-500" />
                    <button
                      type="button"
                      onClick={enableNotifications}
                      className="block w-full text-left cursor-pointer text-sm hover:text-violet-300"
                    >
                      Enable notifications
                    </button>
                  </>
                )}
                <hr className="my-2 border-t border-gray-500" />
                <button
                  type="button"
                  onClick={logout}
                  className="block w-full text-left cursor-pointer text-sm hover:text-violet-300"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div role="tablist" className="grid grid-cols-3 gap-1 p-1 mt-4 rounded-full bg-[#282142]">
          {TABS.map((name) => {
            const badge = name === "Requests" ? incoming.length : name === "Chats" ? totalUnseen : 0;
            return (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={tab === name}
                onClick={() => setTab(name)}
                className={`relative text-xs py-2 rounded-full cursor-pointer transition-colors ${
                  tab === name ? "bg-violet-600 text-white" : "text-gray-300 hover:text-white"
                }`}
              >
                {name}
                {badge > 0 && (
                  <span className="absolute -top-1 -right-0.5 text-[10px] min-w-4 h-4 px-1 flex justify-center items-center rounded-full bg-red-500 text-white">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        {tab === "Discover" && <DiscoverPanel onOpenChat={openChat} />}
        {tab === "Requests" && (
          <RequestsPanel onOpenChat={openChat} onDiscover={() => setTab("Discover")} />
        )}
        {tab === "Chats" && (
          <>
            {users.length > 0 && (
              <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mb-3">
                <img src={assets.search_icon} alt="" className="w-3" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="search"
                  className="bg-transparent border-none outline-none text-white text-base sm:text-xs placeholder-[#c8c8c8] flex-1 min-w-0"
                  placeholder="Search chats..."
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              {users.length === 0 && (
                <div className="text-center text-sm text-gray-400 mt-10 px-4">
                  <p className="text-white text-base mb-1">No chats yet</p>
                  <p>Add friends to start chatting. They'll show up here once they accept.</p>
                  <button
                    type="button"
                    onClick={() => setTab("Discover")}
                    className="mt-4 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                  >
                    Find people
                  </button>
                </div>
              )}
              {users.length > 0 && filteredUsers.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-6">No chats match your search</p>
              )}
              {filteredUsers.map((user) => {
                const unseen = unseenMessages[user._id] || 0;
                const isOnline = onlineUsers.includes(user._id);
                return (
                  <button
                    type="button"
                    key={user._id}
                    onClick={() => selectUser(user)}
                    className={`flex items-center gap-3 p-2 pl-3 rounded-lg cursor-pointer text-left hover:bg-[#282142]/40 max-sm:text-sm ${
                      selectedUser?._id === user._id ? "bg-[#282142]/60" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={user.profilePic || assets.avatar_icon}
                        alt=""
                        className="w-[38px] aspect-square rounded-full object-cover"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-[#1d1838]" />
                      )}
                    </div>

                    <div className="flex flex-col leading-5 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate">{user.fullName}</p>
                        {user.lastMessage && (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {formatSidebarTime(user.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs truncate ${
                            unseen > 0 ? "text-white font-medium" : "text-neutral-400"
                          }`}
                        >
                          {previewText(user)}
                        </span>
                        {unseen > 0 && (
                          <span className="text-[10px] min-w-5 h-5 px-1 flex justify-center items-center rounded-full bg-violet-500 shrink-0">
                            {unseen > 99 ? "99+" : unseen}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
