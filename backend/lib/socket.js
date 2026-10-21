import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.model.js";

let io;

// userId -> number of open connections (a user can have several tabs open)
const onlineUsers = new Map();

const broadcastOnlineUsers = () => {
  io.emit("getOnlineUsers", [...onlineUsers.keys()]);
};

export const initSocket = (server, corsOrigin) => {
  io = new Server(server, { cors: { origin: corsOrigin } });

  // Only allow sockets that present a valid JWT
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const { userId } = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = String(userId);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket;

    // Every socket of a user joins a room named after the user id,
    // so events reach all of that user's tabs/devices.
    socket.join(userId);
    onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
    broadcastOnlineUsers();

    socket.on("typing", ({ to } = {}) => {
      if (mongoose.isValidObjectId(to)) {
        socket.to(String(to)).emit("typing", { from: userId });
      }
    });

    socket.on("disconnect", () => {
      const count = (onlineUsers.get(userId) || 1) - 1;
      if (count > 0) onlineUsers.set(userId, count);
      else {
        onlineUsers.delete(userId);
        // Remember when they were last online, shown as "Last seen …"
        User.updateOne({ _id: userId }, { lastSeen: new Date() }).catch(() => {});
      }
      broadcastOnlineUsers();
    });
  });

  return io;
};

// Send an event to every connected socket of a user
export const emitToUser = (userId, event, payload) => {
  io?.to(String(userId)).emit(event, payload);
};
