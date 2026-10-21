import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  markMessageAsSeen,
  sendMessage,
} from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.use(protectRoute);

messageRouter.get("/users", getUsersForSidebar);
messageRouter.get("/:id", getMessages);
messageRouter.put("/mark/:id", markMessageAsSeen);
messageRouter.post("/send/:id", sendMessage);

export default messageRouter;
