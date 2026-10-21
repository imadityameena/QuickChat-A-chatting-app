import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { generateToken, isDataUrlImage } from "../lib/utils.js";
import { uploadImage } from "../lib/cloudinary.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// Errors thrown in these async handlers are caught by Express 5 and
// passed to the error handler in server.js.

// Sign up a new user
export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  if (!fullName?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ success: false, message: "Missing details" });
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ success: false, message: "Please enter a valid email" });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ success: false, message: "Account already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    fullName,
    email: normalizedEmail,
    password: hashedPassword,
    bio: bio || "",
  });

  res.status(201).json({
    success: true,
    userData: newUser,
    token: generateToken(newUser._id),
    message: "Account created successfully",
  });
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
