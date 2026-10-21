import React, { useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import {
  formatDayLabel,
  formatMessageTime,
  isSameDay,
  readFileAsDataURL,
  validateImageFile,
} from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";

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
      <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
        <img src={assets.logo_icon} className="max-w-16" alt="" />
        <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
        <p className="text-sm text-gray-400">Pick a conversation to start messaging</p>
      </div>
    );
  }

  // Index of my latest message, to show its "Seen"/"Sent" status
  const lastOwnIndex = messages.findLastIndex((m) => m.senderId === authUser._id);
  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden backdrop-blur-lg">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] mx-4 border-b border-stone-500 shrink-0">
        <button
          type="button"
          aria-label="Back"
          onClick={() => selectUser(null)}
          className="md:hidden cursor-pointer"
        >
          <img src={assets.arrow_icon} alt="" className="w-6" />
        </button>
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=""
          className="w-9 aspect-square rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-lg text-white truncate leading-6">{selectedUser.fullName}</p>
          <p className={`text-xs ${isTyping ? "text-violet-300" : isOnline ? "text-green-400" : "text-gray-400"}`}>
            {isTyping ? "typing…" : isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col overflow-y-auto p-3 pb-4 md:px-6">
        {messagesLoading && messages.length === 0 && (
          <div className="m-auto w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        )}

        {!messagesLoading && messages.length === 0 && (
          <div className="m-auto text-center text-gray-400 text-sm">
            <p>No messages yet.</p>
            <p>Say hi to {selectedUser.fullName.split(" ")[0]} 👋</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMine = msg.senderId === authUser._id;
          const showDay = index === 0 || !isSameDay(messages[index - 1].createdAt, msg.createdAt);

          return (
            <React.Fragment key={msg._id}>
              {showDay && (
                <div className="self-center my-3 px-3 py-1 rounded-full bg-white/10 text-[11px] text-gray-300">
                  {formatDayLabel(msg.createdAt)}
                </div>
              )}

              <div className={`flex items-end gap-2 mb-1 ${isMine ? "justify-end" : "justify-start"}`}>
                {!isMine && (
                  <img
                    src={selectedUser.profilePic || assets.avatar_icon}
                    alt=""
                    className="w-7 aspect-square rounded-full object-cover shrink-0"
                  />
                )}

                <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                  {msg.image && (
                    <a href={msg.image} target="_blank" rel="noreferrer">
                      <img
                        src={msg.image}
                        alt="Shared"
                        loading="lazy"
                        className="max-w-[min(230px,60vw)] max-h-72 object-cover border border-gray-700 rounded-lg"
                      />
                    </a>
                  )}
                  {msg.text && (
                    <p
                      className={`px-3 py-2 md:text-sm font-light rounded-2xl whitespace-pre-wrap break-words text-white ${
                        isMine ? "bg-violet-500/50 rounded-br-sm" : "bg-white/10 rounded-bl-sm"
                      } ${msg.image ? "mt-1" : ""}`}
                    >
                      {msg.text}
                    </p>
                  )}
                  <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                    {formatMessageTime(msg.createdAt)}
                    {isMine && index === lastOwnIndex && (msg.seen ? " · Seen" : " · Sent")}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-1 px-3 py-2 mt-1 w-fit rounded-2xl bg-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:300ms]" />
          </div>
        )}
        <div ref={scrollEnd} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 shrink-0">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            ref={inputRef}
            type="text"
            placeholder={sending ? "Sending…" : "Send a message"}
            value={text}
            maxLength={2000}
            onChange={(e) => {
              setText(e.target.value);
              notifyTyping();
            }}
            className="flex-1 min-w-0 bg-transparent text-base sm:text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
          />
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/png, image/jpeg, image/webp, image/gif"
            hidden
            disabled={sending}
          />
          <label htmlFor="image" title="Send an image" className={sending ? "opacity-50" : "cursor-pointer"}>
            <img src={assets.gallery_icon} alt="Send an image" className="w-5 mr-2" />
          </label>
        </div>
        <button
          type="submit"
          aria-label="Send"
          disabled={sending || !text.trim()}
          className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? (
            <span className="block w-7 h-7 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <img src={assets.send_button} alt="" className="w-7" />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatContainer;
