import express from "express";
import { checkAuth, checkEmail, checkUsername, login, signup, updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../lib/rateLimit.js";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Slow down password guessing: 10 tries per email + IP every 15 minutes
const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 10,
  key: (req) =>
    `${req.ip}:${String(req.body?.identifier ?? req.body?.email ?? "").trim().toLowerCase()}`,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

// Limit account creation and email checks per IP
const signupLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 30,
  key: (req) => req.ip,
  message: "Too many attempts. Please try again later.",
});

// Username availability is checked while typing, so allow more requests
const usernameLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 300,
  key: (req) => req.ip,
  message: "Too many checks. Please slow down.",
});

const userRouter = express.Router();

userRouter.post("/signup", signupLimiter, signup);
userRouter.post("/login", loginLimiter, login);
userRouter.post("/check-email", signupLimiter, checkEmail);
userRouter.get("/check-username", usernameLimiter, checkUsername);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);

export default userRouter;
