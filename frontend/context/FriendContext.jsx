import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";
import { ChatContext } from "./ChatContext";
import { getErrorMessage } from "../src/lib/utils";

export const FriendContext = createContext();

// Friend requests and the Discover feed
export const FriendProvider = ({ children }) => {
  const { axios, socket, authUser } = useContext(AuthContext);
  const { getUsers, selectedUser, selectUser } = useContext(ChatContext);

  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [busy, setBusy] = useState({}); // userId -> true while a request is in flight

  const discoverQuery = useRef("");

  // Update one person's status in the Discover list
  const setDiscoverStatus = useCallback((userId, status, requestId = null) => {
    setDiscoverUsers((prev) =>
      status === "friends"
        ? prev.filter((u) => u._id !== userId)
        : prev.map((u) => (u._id === userId ? { ...u, status, requestId } : u))
    );
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/friends/requests");
      if (data.success) {
        setIncoming(data.incoming);
        setOutgoing(data.outgoing);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [axios]);

  const searchDiscover = useCallback(
    async (query = "") => {
      discoverQuery.current = query;
      setDiscoverLoading(true);
      try {
        const { data } = await axios.get("/api/friends/discover", { params: { q: query } });
        // ignore stale responses if the search changed meanwhile
        if (data.success && discoverQuery.current === query) setDiscoverUsers(data.users);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        if (discoverQuery.current === query) setDiscoverLoading(false);
      }
    },
    [axios]
  );

  // Run an action for a user while showing a busy state on their buttons
  const withBusy = async (userId, action) => {
    setBusy((b) => ({ ...b, [userId]: true }));
    try {
      return await action();
    } catch (error) {
      toast.error(getErrorMessage(error));
      return null;
    } finally {
      setBusy((b) => {
        const next = { ...b };
        delete next[userId];
        return next;
      });
    }
  };

  const sendRequest = (user) =>
    withBusy(user._id, async () => {
      const { data } = await axios.post(`/api/friends/request/${user._id}`);
      if (data.accepted) {
        // They had already asked us, so we're friends now
        setIncoming((prev) => prev.filter((r) => r.user._id !== user._id));
        setDiscoverStatus(user._id, "friends");
        getUsers();
        toast.success(data.message);
        return data.user;
      }
      setOutgoing((prev) => [data.request, ...prev]);
      setDiscoverStatus(user._id, "sent", data.request._id);
      toast.success(data.message);
      return null;
    });

  const acceptRequest = (request) =>
    withBusy(request.user._id, async () => {
      const { data } = await axios.post(`/api/friends/requests/${request._id}/accept`);
      setIncoming((prev) => prev.filter((r) => r._id !== request._id));
      setDiscoverStatus(request.user._id, "friends");
      await getUsers();
      toast.success(data.message);
      return data.user;
    });

  const declineRequest = (request) =>
    withBusy(request.user._id, async () => {
      await axios.post(`/api/friends/requests/${request._id}/decline`);
      setIncoming((prev) => prev.filter((r) => r._id !== request._id));
      setDiscoverStatus(request.user._id, "none");
    });

  const cancelRequest = (request) =>
    withBusy(request.user._id, async () => {
      await axios.delete(`/api/friends/requests/${request._id}`);
      setOutgoing((prev) => prev.filter((r) => r._id !== request._id));
      setDiscoverStatus(request.user._id, "none");
    });

  const removeFriend = (user) =>
    withBusy(user._id, async () => {
      await axios.delete(`/api/friends/${user._id}`);
      if (selectedUser?._id === user._id) selectUser(null);
      await getUsers();
      toast.success(`${user.fullName} was removed from your friends`);
      return true;
    });

  // Load requests after login; clear after logout
  useEffect(() => {
    if (authUser?._id) loadRequests();
    else {
      setIncoming([]);
      setOutgoing([]);
      setDiscoverUsers([]);
    }
  }, [authUser?._id, loadRequests]);

  // Real-time friend events
  useEffect(() => {
    if (!socket) return;

    const onRequest = (request) => {
      setIncoming((prev) => (prev.some((r) => r._id === request._id) ? prev : [request, ...prev]));
      setDiscoverStatus(request.user._id, "received", request._id);
      toast(`${request.user.fullName} sent you a friend request`, { icon: "👋" });
    };

    const onRemoved = ({ requestId }) => {
      const matches = (r) => r._id === requestId;
      setIncoming((prev) => prev.filter((r) => !matches(r)));
      setOutgoing((prev) => prev.filter((r) => !matches(r)));
      setDiscoverUsers((prev) =>
        prev.map((u) => (u.requestId === requestId ? { ...u, status: "none", requestId: null } : u))
      );
    };

    const onAccepted = ({ requestId, user }) => {
      setOutgoing((prev) => prev.filter((r) => r._id !== requestId));
      setIncoming((prev) => prev.filter((r) => r.user._id !== user._id));
      setDiscoverStatus(user._id, "friends");
      getUsers();
      toast.success(`${user.fullName} accepted your friend request`);
    };

    socket.on("friendRequest", onRequest);
    socket.on("friendRequestRemoved", onRemoved);
    socket.on("friendRequestAccepted", onAccepted);
    return () => {
      socket.off("friendRequest", onRequest);
      socket.off("friendRequestRemoved", onRemoved);
      socket.off("friendRequestAccepted", onAccepted);
    };
  }, [socket, getUsers, setDiscoverStatus]);

  const value = {
    incoming,
    outgoing,
    discoverUsers,
    discoverLoading,
    busy,
    loadRequests,
    searchDiscover,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  };

  return <FriendContext.Provider value={value}>{children}</FriendContext.Provider>;
};
