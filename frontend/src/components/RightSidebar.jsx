import React, { useContext, useMemo } from "react";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import { FriendContext } from "../../context/FriendContext";
import { formatLastSeen } from "../lib/utils";
import { button } from "../lib/ui";
import { BanIcon, FlagIcon } from "./icons";
import { avatarSrc, imageSrc } from "../lib/images";

// Details about the person in the open chat (large screens only)
const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { onlineUsers } = useContext(AuthContext);
  const { removeFriend, blockUser, openReport, busy, openProfile } = useContext(FriendContext);

  // All images shared in this conversation, newest first
  const msgImages = useMemo(
    () => messages.filter((msg) => msg.image).map((msg) => msg.image).reverse(),
    [messages]
  );

  if (!selectedUser) return null;
  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <aside className="bg-surface text-fg w-full h-full flex flex-col overflow-hidden border-l border-line max-xl:hidden">
      <div className="pt-10 pb-6 flex flex-col items-center gap-1 px-6 text-center">
        <div className="relative mb-2">
          <img
            src={avatarSrc(selectedUser, 96)}
            alt=""
            className="w-24 h-24 rounded-full object-cover bg-surface-2"
          />
          {isOnline && (
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-online ring-[3px] ring-surface" />
          )}
        </div>
        <h2 className="text-lg font-semibold break-words max-w-full">{selectedUser.fullName}</h2>
        {selectedUser.username && <p className="text-sm text-accent-text">@{selectedUser.username}</p>}
        <p className={`text-xs ${isOnline ? "text-success-text" : "text-subtle"}`}>
          {isOnline ? "Online" : formatLastSeen(selectedUser.lastSeen)}
        </p>
        {selectedUser.bio && (
          <p className="mt-2 text-sm text-muted break-words leading-relaxed">{selectedUser.bio}</p>
        )}
        <button type="button" onClick={() => openProfile(selectedUser)} className={`${button.secondary} mt-4`}>
          View full profile
        </button>
      </div>

      <div className="border-t border-line" />

      <div className="px-5 pt-4 flex-1 min-h-0 flex flex-col">
        <p className="text-sm font-medium">
          Shared media {msgImages.length > 0 && <span className="text-subtle font-normal">· {msgImages.length}</span>}
        </p>
        {msgImages.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No photos shared yet</p>
        ) : (
          <div className="mt-3 overflow-y-auto grid grid-cols-3 gap-2 pb-2">
            {msgImages.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="rounded-lg overflow-hidden">
                <img
                  src={imageSrc(url, 240)}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-square object-cover hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-line p-4 flex flex-col gap-1">
        <button
          type="button"
          disabled={!!busy[selectedUser._id]}
          onClick={() => {
            if (
              window.confirm(
                `Remove ${selectedUser.fullName} from your friends? You won't be able to message each other until you add each other again.`
              )
            ) {
              removeFriend(selectedUser);
            }
          }}
          className={`${button.danger} w-full`}
        >
          Remove friend
        </button>
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            disabled={!!busy[selectedUser._id]}
            onClick={() => {
              if (
                window.confirm(
                  `Block ${selectedUser.fullName}? They'll be removed from your friends and won't be able to find you, see your profile or send you friend requests. They won't be told.`
                )
              ) {
                blockUser(selectedUser);
              }
            }}
            className={button.danger}
          >
            <BanIcon /> Block
          </button>
          <button
            type="button"
            disabled={!!busy[selectedUser._id]}
            onClick={() => openReport(selectedUser)}
            className={button.danger}
          >
            <FlagIcon /> Report
          </button>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
