import { createContext, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { getErrorMessage } from "../src/lib/utils";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

const setAuthHeader = (token) => {
  if (token) axios.defaults.headers.common["token"] = token;
  else delete axios.defaults.headers.common["token"];
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem("token");
    setAuthHeader(null);
    setToken(null);
    setAuthUser(null);
  }, []);

  // On first load, restore the session from the saved token
  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      setAuthHeader(token);
      try {
        const { data } = await axios.get("/api/auth/check");
        if (data.success) setAuthUser(data.user);
        else clearSession();
      } catch {
        clearSession(); // invalid/expired token: just show the login page
      } finally {
        setAuthLoading(false);
      }
    };
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log out automatically if the server says the session is no longer valid
  useEffect(() => {
    const id = axios.interceptors.response.use(undefined, (error) => {
      const url = error.config?.url || "";
      const isAuthForm = url.includes("/api/auth/login") || url.includes("/api/auth/signup");
      if (error.response?.status === 401 && !isAuthForm && localStorage.getItem("token")) {
        clearSession();
        toast.error("Session expired, please log in again");
      }
      return Promise.reject(error);
    });
    return () => axios.interceptors.response.eject(id);
  }, [clearSession]);

  // Keep a socket connection open while logged in
  useEffect(() => {
    if (!authUser?._id || !token) return;

    const newSocket = io(backendUrl, { auth: { token } });
    newSocket.on("getOnlineUsers", (userIds) => setOnlineUsers(userIds));
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setOnlineUsers([]);
    };
  }, [authUser?._id, token]);

  // Log in or sign up. Returns true on success.
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (!data.success) {
        toast.error(data.message);
        return false;
      }
      localStorage.setItem("token", data.token);
      setAuthHeader(data.token);
      setToken(data.token);
      setAuthUser(data.userData);
      toast.success(data.message);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  const logout = () => {
    clearSession();
    toast.success("Logged out successfully");
  };

  // Update profile. Returns true on success.
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (!data.success) {
        toast.error(data.message);
        return false;
      }
      setAuthUser(data.user);
      toast.success("Profile updated successfully");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  const value = {
    axios,
    authUser,
    authLoading,
    login,
    logout,
    socket,
    updateProfile,
    onlineUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
