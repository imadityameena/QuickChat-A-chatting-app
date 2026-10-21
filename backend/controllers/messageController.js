import mongoose from "mongoose";
import Message from "../models/message.model.js";
import User, { PUBLIC_USER_FIELDS } from "../models/user.model.js";
import { uploadImage } from "../lib/cloudinary.js";
import { isDataUrlImage } from "../lib/utils.js";
import { emitToUser } from "../lib/socket.js";

const invalidId = (res) =>
  res.status(400).json({ success: false, message: "Invalid user id" });

// Get my friends, with unread counts and the last message of each
// conversation (most recent conversations first)
export const getUsersForSidebar = async (req, res) => {
  const myId = req.user._id;

  const [users, unseenCounts, lastMessages] = await Promise.all([
    User.find({ _id: { $in: req.user.friends } }).select(PUBLIC_USER_FIELDS).lean(),
    Message.aggregate([
      { $match: { receiverId: myId, seen: false, senderId: { $in: req.user.friends } } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } },
    ]),
    Message.aggregate([
      { $match: { $or: [{ senderId: myId }, { receiverId: myId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$senderId", myId] }, "$receiverId", "$senderId"] },
          message: { $first: "$$ROOT" },
        },
      },
    ]),
  ]);

  const unseenMessages = {};
  for (const { _id, count } of unseenCounts) unseenMessages[_id] = count;

  const lastByUser = {};
  for (const { _id, message } of lastMessages) {
    lastByUser[_id] = {
      text: message.text,
      image: Boolean(message.image),
      senderId: message.senderId,
      createdAt: message.createdAt,
    };
  }

  const result = users
    .map((user) => ({ ...user, lastMessage: lastByUser[user._id] || null }))
    .sort((a, b) => {
      const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return tb - ta || a.fullName.localeCompare(b.fullName);
    });

  res.json({ success: true, users: result, unseenMessages });
};

// Get the conversation with a user and mark their messages to me as seen
export const getMessages = async (req, res) => {
  const { id: selectedUserId } = req.params;
  const myId = req.user._id;

  if (!mongoose.isValidObjectId(selectedUserId)) return invalidId(res);

  const messages = await Message.find({
    $or: [
      { senderId: myId, receiverId: selectedUserId },
      { senderId: selectedUserId, receiverId: myId },
    ],
  }).sort({ createdAt: 1 });

  const { modifiedCount } = await Message.updateMany(
    { senderId: selectedUserId, receiverId: myId, seen: false },
    { seen: true }
  );

  // Let the other person know their messages were read
  if (modifiedCount > 0) emitToUser(selectedUserId, "messagesSeen", { by: String(myId) });

  res.json({ success: true, messages });
};

// Mark a single message as seen (only the receiver can do this)
export const markMessageAsSeen = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid message id" });
  }

  const message = await Message.findOneAndUpdate(
    { _id: id, receiverId: req.user._id },
    { seen: true }
  );
  if (!message) {
    return res.status(404).json({ success: false, message: "Message not found" });
  }

  emitToUser(message.senderId, "messagesSeen", { by: String(req.user._id) });
  res.json({ success: true });
};

// Send a message (text and/or image) to a user
export const sendMessage = async (req, res) => {
  const { image } = req.body;
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  const receiverId = req.params.id;
  const senderId = req.user._id;

  if (!mongoose.isValidObjectId(receiverId)) return invalidId(res);
  if (!text && !image) {
    return res.status(400).json({ success: false, message: "Message can't be empty" });
  }
  if (image && !isDataUrlImage(image)) {
    return res.status(400).json({ success: false, message: "Unsupported image format" });
  }
  if (!req.user.friends.some((id) => id.equals(receiverId))) {
    return res
      .status(403)
      .json({ success: false, message: "You can only message your friends" });
  }

  const imageUrl = image ? await uploadImage(image, "messages") : undefined;

  const newMessage = await Message.create({
    senderId,
    receiverId,
    text: text || undefined,
    image: imageUrl,
  });

  // Deliver in real time to the receiver (and the sender's other tabs)
  emitToUser(receiverId, "newMessage", newMessage);
  emitToUser(senderId, "messageSent", newMessage);

  res.status(201).json({ success: true, newMessage });
};
