import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { generateToken, isDataUrlImage } from "../lib/utils.js";
import { uploadImage } from "../lib/cloudinary.js";

import {
  MAX_NAME_LENGTH,
  normalizeEmail,
  validateEmail,
  validatePassword,
} from "../lib/validation.js";

// Errors thrown in these async handlers are caught by Express 5 and
// passed to the error handler in server.js.

// Sign up a new user
export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  const name = String(fullName ?? "").trim();
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail || !password) {
    return res.status(400).json({ success: false, message: "Missing details" });
  }
  if (name.length < 2 || name.length > MAX_NAME_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Name must be 2–${MAX_NAME_LENGTH} characters`,
    });
  }
  const emailError = await validateEmail(normalizedEmail);
  if (emailError) {
    return res.status(400).json({ success: false, message: emailError });
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ success: false, message: passwordError });
  }

  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ success: false, message: "An account with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    fullName: name,
    email: normalizedEmail,
    password: hashedPassword,
    bio: String(bio ?? "").trim().slice(0, 200),
  });

  res.status(201).json({
    success: true,
    userData: newUser,
    token: generateToken(newUser._id),
    message: "Account created successfully",
  });
};

// Check an email before the signup form moves on, so people learn early
// that it's mistyped or already registered.
export const checkEmail = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const error = await validateEmail(email);
  if (error) return res.json({ success: false, message: error });
  if (await User.exists({ email })) {
    return res.json({ success: false, message: "An account with this email already exists" });
  }
  res.json({ success: true });
};

// Log in an existing user
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
  const isPasswordCorrect = user && (await bcrypt.compare(password, user.password));

  if (!isPasswordCorrect) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  res.json({
    success: true,
    userData: user, // password is stripped by the model's toJSON
    token: generateToken(user._id),
    message: "Login successful",
  });
};

// Check if the user is authenticated
export const checkAuth = (req, res) => {
  res.json({ success: true, user: req.user });
};

// Update profile details (name, bio, picture)
export const updateProfile = async (req, res) => {
  const { profilePic, bio, fullName } = req.body;
  const update = {};

  if (fullName !== undefined) {
    if (!fullName.trim()) {
      return res.status(400).json({ success: false, message: "Name can't be empty" });
    }
    update.fullName = fullName;
  }
  if (bio !== undefined) update.bio = bio;

  if (profilePic) {
    if (!isDataUrlImage(profilePic)) {
      return res.status(400).json({ success: false, message: "Unsupported image format" });
    }
    update.profilePic = await uploadImage(profilePic, "avatars");
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, user: updatedUser, message: "Profile updated successfully" });
};
