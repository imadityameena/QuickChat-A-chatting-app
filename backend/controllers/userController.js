import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import Report from "../models/report.model.js";
import { generateToken, isDataUrlImage } from "../lib/utils.js";
import { deleteImages, uploadImage } from "../lib/cloudinary.js";
import { disconnectUser, emitToUser } from "../lib/socket.js";

import {
  MAX_NAME_LENGTH,
  formatName,
  normalizeEmail,
  normalizeUsername,
  validateEmail,
  validatePassword,
  validateUsername,
} from "../lib/validation.js";
import { suggestUsernames } from "../lib/username.js";

// Turn a duplicate-key error from MongoDB into a friendly 409 response
const duplicateKeyResponse = (res, err) => {
  const field = Object.keys(err.keyPattern || {})[0];
  const message =
    field === "username"
      ? "This username was just taken, please choose another"
      : "An account with this email already exists";
  return res.status(409).json({ success: false, message });
};

// Errors thrown in these async handlers are caught by Express 5 and
// passed to the error handler in server.js.

// Sign up a new user
export const signup = async (req, res) => {
  const { fullName, email, password, bio, profilePic } = req.body;

  const name = formatName(fullName);
  const normalizedEmail = normalizeEmail(email);
  const username = normalizeUsername(req.body.username);

  if (!name || !normalizedEmail || !password || !username) {
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
  const usernameError = validateUsername(username);
  if (usernameError) {
    return res.status(400).json({ success: false, message: usernameError });
  }
  if (profilePic && !isDataUrlImage(profilePic)) {
    return res.status(400).json({ success: false, message: "Unsupported image format" });
  }

  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ success: false, message: "An account with this email already exists" });
  }
  if (await User.exists({ username })) {
    return res.status(409).json({ success: false, message: "This username is already taken" });
  }

  // Optional profile picture. If the upload fails we still create the
  // account; the picture can be added later from the profile page.
  let profilePicUrl = "";
  let picFailed = false;
  if (profilePic) {
    try {
      profilePicUrl = await uploadImage(profilePic, "avatars");
    } catch (err) {
      console.error("Signup avatar upload failed:", err.message);
      picFailed = true;
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let newUser;
  try {
    newUser = await User.create({
      username,
      fullName: name,
      email: normalizedEmail,
      password: hashedPassword,
      bio: String(bio ?? "").trim().slice(0, 200),
      profilePic: profilePicUrl,
    });
  } catch (err) {
    if (err.code === 11000) return duplicateKeyResponse(res, err);
    throw err;
  }

  res.status(201).json({
    success: true,
    userData: newUser,
    token: generateToken(newUser._id),
    message: picFailed
      ? "Account created, but the profile picture couldn't be uploaded. You can add it from your profile."
      : "Account created successfully",
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

// Is a username free? Returns suggestions when it isn't.
export const checkUsername = async (req, res) => {
  const username = normalizeUsername(req.query.username);
  const error = validateUsername(username);
  if (error) return res.json({ success: true, available: false, message: error });

  if (await User.exists({ username })) {
    const base = typeof req.query.name === "string" && req.query.name.trim() ? req.query.name : username;
    return res.json({
      success: true,
      available: false,
      message: "This username is already taken",
      suggestions: await suggestUsernames(base),
    });
  }
  res.json({ success: true, available: true });
};

// Log in an existing user
export const login = async (req, res) => {
  const { password } = req.body;
  // "identifier" can be an email or a username (old clients send "email")
  const identifier = String(req.body.identifier ?? req.body.email ?? "").trim();

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email or username and password are required" });
  }

  const query = identifier.includes("@") && !identifier.startsWith("@")
    ? { email: normalizeEmail(identifier) }
    : { username: normalizeUsername(identifier) };
  const user = await User.findOne(query).select("+password");
  const isPasswordCorrect = user && (await bcrypt.compare(password, user.password));

  if (!isPasswordCorrect) {
    return res.status(401).json({ success: false, message: "Invalid login details" });
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
    const name = formatName(fullName);
    if (name.length < 2 || name.length > MAX_NAME_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Name must be 2–${MAX_NAME_LENGTH} characters`,
      });
    }
    update.fullName = name;
  }
  if (bio !== undefined) update.bio = String(bio).trim().slice(0, 200);

  if (req.body.username !== undefined) {
    const username = normalizeUsername(req.body.username);
    if (username !== req.user.username) {
      const error = validateUsername(username);
      if (error) return res.status(400).json({ success: false, message: error });
      if (await User.exists({ username, _id: { $ne: req.user._id } })) {
        return res.status(409).json({ success: false, message: "This username is already taken" });
      }
      update.username = username;
    }
  }

  if (profilePic) {
    if (!isDataUrlImage(profilePic)) {
      return res.status(400).json({ success: false, message: "Unsupported image format" });
    }
    update.profilePic = await uploadImage(profilePic, "avatars");
  } else if (req.body.removeProfilePic === true) {
    update.profilePic = ""; // back to the default avatar
  }

  let updatedUser;
  try {
    updatedUser = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    });
  } catch (err) {
    if (err.code === 11000) return duplicateKeyResponse(res, err);
    throw err;
  }

  res.json({ success: true, user: updatedUser, message: "Profile updated successfully" });
};

// Permanently delete the logged-in user's account and everything tied to it:
// their conversations (both sides), photos, friend requests and friendships.
// The password is asked again so a borrowed, logged-in device can't do this.
export const deleteAccount = async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: "Please enter your password" });
  }

  const me = await User.findById(req.user._id).select("+password");
  // 400, not 401: the app treats any 401 as "session expired" and logs you out
  if (!me || !(await bcrypt.compare(String(password), me.password))) {
    return res.status(400).json({ success: false, message: "Incorrect password" });
  }

  const myId = me._id;
  const inMyChats = { $or: [{ senderId: myId }, { receiverId: myId }] };
  const [photoMessages, requests] = await Promise.all([
    Message.find({ ...inMyChats, image: { $exists: true, $ne: "" } }).select("image").lean(),
    FriendRequest.find({ $or: [{ from: myId }, { to: myId }] }).lean(),
  ]);

  await Promise.all([
    Message.deleteMany(inMyChats),
    FriendRequest.deleteMany({ $or: [{ from: myId }, { to: myId }] }),
    User.updateMany({ friends: myId }, { $pull: { friends: myId } }),
    User.updateMany({ blocked: myId }, { $pull: { blocked: myId } }),
    Report.deleteMany({ $or: [{ reporter: myId }, { reported: myId }] }),
  ]);
  await User.deleteOne({ _id: myId });

  res.json({ success: true, message: "Your account has been deleted" });

  // After replying: update other people's screens and clean up photos
  for (const friendId of me.friends) emitToUser(friendId, "friendRemoved", { userId: String(myId) });
  for (const r of requests) {
    const otherId = r.from.equals(myId) ? r.to : r.from;
    emitToUser(otherId, "friendRequestRemoved", { requestId: r._id });
  }
  disconnectUser(myId, "accountDeleted");
  deleteImages([me.profilePic, ...photoMessages.map((m) => m.image)]);
};
