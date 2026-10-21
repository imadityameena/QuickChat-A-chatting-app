import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  acceptRequest,
  cancelRequest,
  declineRequest,
  discoverUsers,
  getProfile,
  getRequests,
  removeFriend,
  sendRequest,
} from "../controllers/friendController.js";

const friendRouter = express.Router();

friendRouter.use(protectRoute);

friendRouter.get("/discover", discoverUsers);
friendRouter.get("/requests", getRequests);
friendRouter.get("/profile/:userId", getProfile);
friendRouter.post("/request/:userId", sendRequest);
friendRouter.post("/requests/:requestId/accept", acceptRequest);
friendRouter.post("/requests/:requestId/decline", declineRequest);
friendRouter.delete("/requests/:requestId", cancelRequest);
friendRouter.delete("/:userId", removeFriend);

export default friendRouter;
