import jwt from "jsonwebtoken";

// Generate a login token for a user
export const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Check that a value is a base64 data-URL of a supported image type
export const isDataUrlImage = (value) =>
  typeof value === "string" && /^data:image\/(png|jpe?g|gif|webp);base64,/.test(value);
