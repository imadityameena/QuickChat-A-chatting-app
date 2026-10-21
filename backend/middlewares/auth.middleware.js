import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Protect routes: requires a valid token in the `token` header
// (or `Authorization: Bearer <token>`)
export const protectRoute = async (req, res, next) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.headers.token || bearer;

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, please log in" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: "Session expired, please log in again" });
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return res.status(401).json({ success: false, message: "User not found" });
  }

  req.user = user;
  next();
};
