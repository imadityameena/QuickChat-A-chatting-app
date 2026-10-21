import React, { useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import {
  formatDayLabel,
  formatLastSeen,
  formatMessageTime,
  isSameDay,
  readFileAsDataURL,
  validateImageFile,
} from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import { FriendContext } from "../../context/FriendContext";
import { ArrowLeftIcon, ImageIcon, SendIcon } from "./icons";

const ChatContainer = () => {
  const scrollEnd = useRef(null);
  const inputRef = useRef(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const { authUser, onlineUsers } = useContext(AuthContext);
  const {
    messages,
    messagesLoading,
    sendMessage,
    selectedUser,
    selectUser,
    typingUsers,
    notifyTyping,
  } = useContext(ChatContext);

  const { openProfile } = useContext(FriendContext);
  const isTyping = selectedUser && typingUsers[selectedUser._id];

  // Auto scroll to the newest message
  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Reset the draft and focus the input when switching chats
  useEffect(() => {
    setText("");
    inputRef.current?.focus();
  }, [selectedUser?._id]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const ok = await sendMessage({ text: trimmed });
    if (ok) setText("");
    setSending(false);
    inputRef.current?.focus();
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setSending(true);
    try {
      await sendMessage({ image: await readFileAsDataURL(file) });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-center px-6 max-md:hidden">
        <img src={assets.logo_icon} className="w-16 mb-2" alt="" />
        <p className="text-xl font-semibold text-fg">Chat anytime, anywhere</p>
        <p className="text-sm text-muted">Pick a conversation from the list to start messaging.</p>
      </div>
    );
  }

  // Index of my latest message, to show its "Seen"/"Sent" status
  const lastOwnIndex = messages.findLastIndex((m) => m.senderId === authUser._id);
  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden text-fg">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 sm:px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-line bg-surface/80 backdrop-blur-md shrink-0">
        <button
          type="button"
          aria-label="Back"
          onClick={() => selectUser(null)}
          className="md:hidden w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-muted hover:text-fg hover:bg-surface-3 cursor-pointer"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => openProfile(selectedUser)}
          title="View profile"
          className="flex-1 min-w-0 flex items-center gap-3 text-left rounded-xl px-1 py-0.5 cursor-pointer"
        >
          <div className="relative shrink-0">
            <img
              src={selectedUser.profilePic || assets.avatar_icon}
              alt=""
              className="w-10 h-10 rounded-full object-cover bg-surface-2"
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-online ring-2 ring-surface" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate leading-tight">{selectedUser.fullName}</p>
            <p className={`text-xs mt-0.5 ${isTyping ? "text-accent-text" : isOnline ? "text-success-text" : "text-subtle"}`}>
              {isTyping ? "typing…" : isOnline ? "Online" : formatLastSeen(selectedUser.lastSeen)}
            </p>
          </div>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 flex flex-col overflow-y-auto px-3 sm:px-5 md:px-8 py-4">
        {messagesLoading && messages.length === 0 && (
          <div className="m-auto w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        )}

        {!messagesLoading && messages.length === 0 && (
          <div className="m-auto text-center">
            <img
              src={selectedUser.profilePic || assets.avatar_icon}
              alt=""
              className="w-20 h-20 mx-auto rounded-full object-cover mb-3 bg-surface-2"
            />
            <p className="font-medium">No messages yet</p>
            <p className="text-sm text-muted mt-1">Say hi to {selectedUser.fullName.split(" ")[0]} 👋</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMine = msg.senderId === authUser._id;
          const showDay = index === 0 || !isSameDay(messages[index - 1].createdAt, msg.createdAt);
          // group consecutive messages from the same person
          const next = messages[index + 1];
          const lastInGroup = !next || next.senderId !== msg.senderId || !isSameDay(next.createdAt, msg.createdAt);

          return (
            <React.Fragment key={msg._id}>
              {showDay && (
                <div className="self-center my-4 px-3 py-1 rounded-full bg-surface-2 border border-line text-xs text-muted">
                  {formatDayLabel(msg.createdAt)}
                </div>
              )}

              <div className={`flex items-end gap-2 ${lastInGroup ? "mb-3" : "mb-1"} ${isMine ? "justify-end" : "justify-start"}`}>
                {!isMine &&
                  (lastInGroup ? (
                    <img
                      src={selectedUser.profilePic || assets.avatar_icon}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover shrink-0 bg-surface-2"
                    />
                  ) : (
                    <span className="w-7 shrink-0" />
                  ))}

                <div className={`flex flex-col max-w-[80%] md:max-w-[65%] ${isMine ? "items-end" : "items-start"}`}>
                  {msg.image && (
                    <a href={msg.image} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={msg.image}
                        alt="Shared"
                        loading="lazy"
                        className="max-w-[min(260px,65vw)] max-h-80 object-cover border border-line rounded-2xl"
                      />
                    </a>
                  )}
                  {msg.text && (
                    <p
                      className={`px-3.5 py-2 text-[15px] sm:text-sm leading-relaxed rounded-2xl whitespace-pre-wrap break-words ${
                        isMine
                          ? `bg-accent text-accent-fg ${lastInGroup ? "rounded-br-md" : ""}`
                          : `bg-surface-2 text-fg border border-line ${lastInGroup ? "rounded-bl-md" : ""}`
                      } ${msg.image ? "mt-1" : ""}`}
                    >
                      {msg.text}
                    </p>
                  )}
                  {lastInGroup && (
                    <span className="text-xs text-subtle mt-1 px-1">
                      {formatMessageTime(msg.createdAt)}
                      {isMine && index === lastOwnIndex && (msg.seen ? " · Seen" : " · Sent")}
                    </span>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-1 px-4 py-3 mt-1 ml-9 w-fit rounded-2xl rounded-bl-md bg-surface-2 border border-line">
            <span className="w-1.5 h-1.5 rounded-full bg-subtle animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-subtle animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-subtle animate-bounce [animation-delay:300ms]" />
          </div>
        )}
        <div ref={scrollEnd} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-3 sm:px-5 md:px-8 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0"
      >
        <div className="flex-1 flex items-center bg-surface-2 border border-line rounded-full pl-4 pr-1.5 transition-colors focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
          <input
            ref={inputRef}
            type="text"
            placeholder={sending ? "Sending…" : "Type a message"}
            value={text}
            maxLength={2000}
            onChange={(e) => {
              setText(e.target.value);
              notifyTyping();
            }}
            className="flex-1 min-w-0 bg-transparent text-base sm:text-sm py-3 outline-none text-fg placeholder:text-subtle"
          />
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/png, image/jpeg, image/webp, image/gif"
            hidden
            disabled={sending}
          />
          <label
            htmlFor="image"
            title="Send an image"
            aria-label="Send an image"
            className={`w-9 h-9 rounded-full flex items-center justify-center text-muted ${
              sending ? "opacity-50" : "cursor-pointer hover:text-fg hover:bg-surface-3"
            }`}
          >
            <ImageIcon className="w-5 h-5" />
          </label>
        </div>
        <button
          type="submit"
          aria-label="Send"
          disabled={sending || !text.trim()}
          className="w-11 h-11 shrink-0 rounded-full bg-accent hover:bg-accent-hover text-accent-fg flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? (
            <span className="block w-5 h-5 border-2 border-accent-fg border-t-transparent rounded-full animate-spin" />
          ) : (
            <SendIcon className="w-5 h-5 -ml-0.5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatContainer;
