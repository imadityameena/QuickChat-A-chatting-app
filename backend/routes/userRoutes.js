import express from "express";
import { checkAuth, checkEmail, login, signup, updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.post("/check-email", checkEmail);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);

export default userRouter;
