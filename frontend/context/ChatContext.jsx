import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";
import { getErrorMessage } from "../src/lib/utils";

const TYPING_TIMEOUT = 3000; // hide "typing…" after 3s without new events
const TYPING_THROTTLE = 2000; // send at most one typing event per 2s

export const ChatContext = createContext();

const toPreview = (message) => ({
  text: message.text,
  image: Boolean(message.image),
  senderId: message.senderId,
  createdAt: message.createdAt,
});

// Desktop notification for a new message while the tab is in the background
const showNotification = (sender, message) => {
  if (!document.hidden || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(sender?.fullName || "New message", {
      body: message.text || "📷 Photo",
      icon: sender?.profilePic || "/favicon.svg",
      tag: `quickchat-${message.senderId}`, // replace older notifications from the same person
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // some mobile browsers only allow notifications from a service worker
  }
};

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  // Which page the home screen shows: "chats", "discover" or "requests"
  const [view, setViewState] = useState("chats");

  const { socket, axios, authUser, onlineUsers } = useContext(AuthContext);

  // Refs let socket handlers read current values without re-subscribing
  const selectedUserRef = useRef(null);
  const usersRef = useRef([]);
  const typingTimers = useRef({});
  const lastTypingSent = useRef(0);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  // Move a conversation to the top of the list with its newest message
  const bumpConversation = useCallback((userId, message) => {
    setUsers((prev) => {
      const user = prev.find((u) => u._id === userId);
      if (!user) return prev;
      return [{ ...user, lastMessage: toPreview(message) }, ...prev.filter((u) => u._id !== userId)];
    });
  }, []);

  const getUsers = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [axios]);

  const getMessages = useCallback(
    async (userId) => {
      setMessagesLoading(true);
      try {
        const { data } = await axios.get(`/api/messages/${userId}`);
        // ignore the response if the user switched chats meanwhile
        if (data.success && selectedUserRef.current?._id === userId) {
          setMessages(data.messages);
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        if (selectedUserRef.current?._id === userId) setMessagesLoading(false);
      }
    },
    [axios]
  );

  const selectUser = useCallback((user) => {
    setSelectedUser(user);
    setMessages([]);
    if (user) {
      setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
      setViewState("chats");
    }
  }, []);

  // Switching to Discover or Requests closes the open conversation
  const setView = useCallback((next) => {
    setViewState(next);
    if (next !== "chats") {
      setSelectedUser(null);
      setMessages([]);
    }
  }, []);

  // Send a message to the selected user. Returns true on success.
  const sendMessage = async (messageData) => {
    const receiver = selectedUser;
    if (!receiver) return false;
    try {
      const { data } = await axios.post(`/api/messages/send/${receiver._id}`, messageData);
      if (!data.success) {
        toast.error(data.message);
        return false;
      }
      if (selectedUserRef.current?._id === receiver._id) {
        setMessages((prev) =>
          prev.some((m) => m._id === data.newMessage._id) ? prev : [...prev, data.newMessage]
        );
      }
      bumpConversation(receiver._id, data.newMessage);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  // Tell the selected user that we're typing (throttled)
  const notifyTyping = () => {
    const now = Date.now();
    if (!socket || !selectedUser || now - lastTypingSent.current < TYPING_THROTTLE) return;
    lastTypingSent.current = now;
    socket.emit("typing", { to: selectedUser._id });
  };

  const clearTyping = useCallback((userId) => {
    clearTimeout(typingTimers.current[userId]);
    setTypingUsers((prev) => {
      if (!prev[userId]) return prev;
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  // Load the user list after login; reset everything after logout
  useEffect(() => {
    if (authUser?._id) {
      getUsers();
    } else {
      setUsers([]);
      setMessages([]);
      setSelectedUser(null);
      setUnseenMessages({});
      setTypingUsers({});
      setViewState("chats");
    }
  }, [authUser?._id, getUsers]);

  // When a friend goes offline, update their "last seen" time locally
  const prevOnline = useRef([]);
  useEffect(() => {
    const nowOnline = new Set(onlineUsers);
    const wentOffline = prevOnline.current.filter((id) => !nowOnline.has(id));
    prevOnline.current = onlineUsers;
    if (wentOffline.length === 0) return;
    const now = new Date().toISOString();
    const update = (u) => (wentOffline.includes(u._id) ? { ...u, lastSeen: now } : u);
    setUsers((prev) => prev.map(update));
    setSelectedUser((prev) => (prev ? update(prev) : prev));
  }, [onlineUsers]);

  // Show the unread count in the browser tab title
  useEffect(() => {
    const total = Object.values(unseenMessages).reduce((sum, n) => sum + n, 0);
    document.title = total > 0 ? `(${total > 99 ? "99+" : total}) QuickChat` : "QuickChat";
  }, [unseenMessages]);

  // Fetch messages whenever the selected chat changes
  useEffect(() => {
    if (selectedUser?._id) getMessages(selectedUser._id);
  }, [selectedUser?._id, getMessages]);

  // Real-time events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      const fromId = message.senderId;
      clearTyping(fromId);

      showNotification(usersRef.current.find((u) => u._id === fromId), message);

      if (selectedUserRef.current?._id === fromId) {
        setMessages((prev) => [...prev, { ...message, seen: true }]);
        axios.put(`/api/messages/mark/${message._id}`).catch(() => {});
      } else {
        setUnseenMessages((prev) => ({ ...prev, [fromId]: (prev[fromId] || 0) + 1 }));
      }

      if (usersRef.current.some((u) => u._id === fromId)) bumpConversation(fromId, message);
      else getUsers(); // message from someone not in our list yet
    };

    // Our own message sent from another tab/device
    const handleMessageSent = (message) => {
      const toId = message.receiverId;
      if (selectedUserRef.current?._id === toId) {
        setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
      }
      bumpConversation(toId, message);
    };

    const handleMessagesSeen = ({ by }) => {
      if (selectedUserRef.current?._id === by) {
        setMessages((prev) => prev.map((m) => (m.receiverId === by ? { ...m, seen: true } : m)));
      }
    };

    const handleTyping = ({ from }) => {
      setTypingUsers((prev) => (prev[from] ? prev : { ...prev, [from]: true }));
      clearTimeout(typingTimers.current[from]);
      typingTimers.current[from] = setTimeout(() => clearTyping(from), TYPING_TIMEOUT);
    };

    // A friend removed us: drop them from the list and close their chat
    const handleFriendRemoved = ({ userId }) => {
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setUnseenMessages((prev) => ({ ...prev, [userId]: 0 }));
      if (selectedUserRef.current?._id === userId) {
        setSelectedUser(null);
        setMessages([]);
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("friendRemoved", handleFriendRemoved);
    socket.on("messageSent", handleMessageSent);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("friendRemoved", handleFriendRemoved);
      socket.off("messageSent", handleMessageSent);
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("typing", handleTyping);
    };
  }, [socket, axios, getUsers, bumpConversation, clearTyping]);

  // Keep the selected user's details fresh when the list reloads
  useEffect(() => {
    if (!selectedUser) return;
    const fresh = users.find((u) => u._id === selectedUser._id);
    if (fresh && (fresh.fullName !== selectedUser.fullName || fresh.profilePic !== selectedUser.profilePic || fresh.bio !== selectedUser.bio)) {
      setSelectedUser(fresh);
    }
  }, [users, selectedUser]);

  const value = {
    messages,
    messagesLoading,
    users,
    selectedUser,
    getUsers,
    sendMessage,
    selectUser,
    setSelectedUser: selectUser,
    unseenMessages,
    setUnseenMessages,
    typingUsers,
    notifyTyping,
    view,
    setView,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
