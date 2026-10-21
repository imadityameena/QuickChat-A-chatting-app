import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import { FriendContext } from "../../context/FriendContext";
import { formatSidebarTime } from "../lib/utils";
import { useTheme } from "../lib/theme";
import { button } from "../lib/ui";
import Logo from "./Logo";
import ViewTabs from "./ViewTabs";
import {
  BellIcon,
  CompassIcon,
  LogOutIcon,
  MenuIcon,
  MonitorIcon,
  MoonIcon,
  PencilIcon,
  SearchIcon,
  SunIcon,
  UserIcon,
} from "./icons";

const THEME_OPTIONS = [
  { id: "light", label: "Light", Icon: SunIcon },
  { id: "dark", label: "Dark", Icon: MoonIcon },
  { id: "system", label: "Auto", Icon: MonitorIcon },
];

const MenuItem = ({ onClick, children, danger }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left cursor-pointer transition-colors ${
      danger ? "text-danger hover:bg-danger-soft" : "text-fg hover:bg-surface-3"
    }`}
  >
    {children}
  </button>
);

const Sidebar = () => {
  const { users, selectedUser, selectUser, unseenMessages, typingUsers, view, setView } =
    useContext(ChatContext);
  const { logout, onlineUsers, authUser } = useContext(AuthContext);
  const { openProfile } = useContext(FriendContext);
  const [themeMode, setThemeMode] = useTheme();

  const [search, setSearch] = useState("");
  const [notifPermission, setNotifPermission] = useState(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close the menu when clicking anywhere else or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const query = search.trim().toLowerCase();
  const filteredUsers = query
    ? users.filter(
        (user) =>
          user.fullName.toLowerCase().includes(query) ||
          user.username?.includes(query.replace(/^@/, ""))
      )
    : users;

  const enableNotifications = async () => {
    setMenuOpen(false);
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  const previewText = (user) => {
    if (typingUsers[user._id]) return <span className="text-accent-text">typing…</span>;
    const last = user.lastMessage;
    if (!last) return onlineUsers.includes(user._id) ? "Online" : "Say hi 👋";
    const prefix = last.senderId === authUser._id ? "You: " : "";
    return prefix + (last.image && !last.text ? "📷 Photo" : last.text);
  };

  return (
    <aside
      className={`bg-surface h-full min-h-0 flex flex-col md:border-r border-line text-fg ${
        // phones show one screen at a time: hide the list while a chat or another page is open
        selectedUser || view !== "chats" ? "max-md:hidden" : ""
      }`}
    >
      <div className="shrink-0 px-4 sm:px-5 pt-[max(1rem,env(safe-area-inset-top))] md:pt-5 pb-4">
        <div className="flex justify-between items-center">
          <Logo />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Open menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-fg hover:bg-surface-3 cursor-pointer transition-colors"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute top-full right-0 mt-1 z-30 w-56 p-1.5 rounded-xl bg-surface border border-line shadow-xl shadow-black/20"
              >
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    openProfile(authUser._id);
                  }}
                >
                  <UserIcon className="w-4 h-4 text-muted" /> My profile
                </MenuItem>
                <MenuItem onClick={() => navigate("/profile")}>
                  <PencilIcon className="w-4 h-4 text-muted" /> Edit profile
                </MenuItem>
                {notifPermission === "default" && (
                  <MenuItem onClick={enableNotifications}>
                    <BellIcon className="w-4 h-4 text-muted" /> Enable notifications
                  </MenuItem>
                )}

                <div className="px-3 pt-3 pb-1.5 text-xs text-subtle">Theme</div>
                <div className="grid grid-cols-3 gap-1 px-1.5 pb-1.5">
                  {THEME_OPTIONS.map((opt) => {
                    const OptIcon = opt.Icon;
                    const active = themeMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setThemeMode(opt.id)}
                        className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          active ? "bg-accent-soft text-accent-text font-medium" : "text-muted hover:bg-surface-3"
                        }`}
                      >
                        <OptIcon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div className="my-1 border-t border-line" />
                <MenuItem danger onClick={logout}>
                  <LogOutIcon className="w-4 h-4" /> Log out
                </MenuItem>
              </div>
            )}
          </div>
        </div>

        <ViewTabs className="mt-4" />

        {users.length > 0 && (
          <label className="mt-3 flex items-center gap-2 bg-surface-2 border border-line rounded-full px-4 py-2.5 transition-colors focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
            <SearchIcon className="w-4 h-4 text-subtle shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
              className="flex-1 min-w-0 bg-transparent outline-none text-fg text-base sm:text-sm placeholder:text-subtle"
              placeholder="Search chats"
            />
          </label>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {users.length === 0 && (
          <div className="text-center mt-10 px-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-accent-soft text-accent-text flex items-center justify-center mb-3">
              <CompassIcon className="w-5 h-5" />
            </div>
            <p className="font-medium">No chats yet</p>
            <p className="text-sm text-muted mt-1">
              Add friends to start chatting. They'll show up here once they accept.
            </p>
            <button type="button" onClick={() => setView("discover")} className={`${button.primary} mt-4`}>
              Find people
            </button>
          </div>
        )}
        {users.length > 0 && filteredUsers.length === 0 && (
          <p className="text-center text-sm text-muted mt-6">No chats match your search</p>
        )}

        <div className="flex flex-col gap-0.5">
          {filteredUsers.map((user) => {
            const unseen = unseenMessages[user._id] || 0;
            const isOnline = onlineUsers.includes(user._id);
            const active = view === "chats" && selectedUser?._id === user._id;
            return (
              <button
                type="button"
                key={user._id}
                onClick={() => selectUser(user)}
                aria-current={active ? "true" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-left transition-colors ${
                  active ? "bg-accent-soft" : "hover:bg-surface-2"
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={user.profilePic || assets.avatar_icon}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover bg-surface-2"
                  />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-online ring-2 ring-surface" />
                  )}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate ${unseen > 0 ? "font-semibold" : "font-medium"}`}>{user.fullName}</p>
                    {user.lastMessage && (
                      <span className={`text-xs shrink-0 ${unseen > 0 ? "text-accent-text font-medium" : "text-subtle"}`}>
                        {formatSidebarTime(user.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className={`text-sm truncate ${unseen > 0 ? "text-fg" : "text-muted"}`}>
                      {previewText(user)}
                    </span>
                    {unseen > 0 && (
                      <span className="text-xs font-medium min-w-5 h-5 px-1.5 flex justify-center items-center rounded-full bg-accent text-accent-fg shrink-0">
                        {unseen > 99 ? "99+" : unseen}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
