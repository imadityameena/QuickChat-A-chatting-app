import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  acceptRequest,
  blockUser,
  cancelRequest,
  declineRequest,
  discoverUsers,
  getBlockedUsers,
  getProfile,
  getRequests,
  removeFriend,
  reportUser,
  sendRequest,
  unblockUser,
} from "../controllers/friendController.js";
import { rateLimit } from "../lib/rateLimit.js";

// Stop report spam: 10 reports per user per hour
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  key: (req) => String(req.user._id),
  message: "You've sent a lot of reports. Please try again later.",
});

const friendRouter = express.Router();

friendRouter.use(protectRoute);

friendRouter.get("/discover", discoverUsers);
friendRouter.get("/requests", getRequests);
friendRouter.get("/profile/:userId", getProfile);
friendRouter.post("/request/:userId", sendRequest);
friendRouter.post("/requests/:requestId/accept", acceptRequest);
friendRouter.post("/requests/:requestId/decline", declineRequest);
friendRouter.delete("/requests/:requestId", cancelRequest);
friendRouter.get("/blocked", getBlockedUsers);
friendRouter.post("/block/:userId", blockUser);
friendRouter.delete("/block/:userId", unblockUser);
friendRouter.post("/report/:userId", reportLimiter, reportUser);
friendRouter.delete("/:userId", removeFriend);

export default friendRouter;
