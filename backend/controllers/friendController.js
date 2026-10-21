import mongoose from "mongoose";
import User, { PUBLIC_USER_FIELDS } from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import { emitToUser } from "../lib/socket.js";

const DISCOVER_LIMIT = 50;

const bad = (res, status, message) => res.status(status).json({ success: false, message });

const isFriend = (user, otherId) => user.friends.some((id) => id.equals(otherId));

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Make two users friends and remove any pending requests between them
const makeFriends = async (a, b) => {
  await Promise.all([
    User.updateOne({ _id: a }, { $addToSet: { friends: b } }),
    User.updateOne({ _id: b }, { $addToSet: { friends: a } }),
    FriendRequest.deleteMany({
      $or: [
        { from: a, to: b },
        { from: b, to: a },
      ],
    }),
  ]);
};

const publicUser = (id) => User.findById(id).select(PUBLIC_USER_FIELDS).lean();

// People you aren't friends with yet, newest first, with the request status
// between you: "none", "sent" (you asked them) or "received" (they asked you)
export const discoverUsers = async (req, res) => {
  const me = req.user;
  const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 50) : "";

  const filter = { _id: { $nin: [me._id, ...me.friends] } };
  if (query) {
    const pattern = { $regex: escapeRegex(query.replace(/^@/, "")), $options: "i" };
    filter.$or = [{ fullName: pattern }, { username: pattern }];
  }

  const users = await User.find(filter)
    .select(PUBLIC_USER_FIELDS)
    .sort({ createdAt: -1 })
    .limit(DISCOVER_LIMIT)
    .lean();

  const ids = users.map((u) => u._id);
  const requests = await FriendRequest.find({
    $or: [
      { from: me._id, to: { $in: ids } },
      { to: me._id, from: { $in: ids } },
    ],
  }).lean();

  const statusById = {};
  for (const r of requests) {
    const sent = r.from.equals(me._id);
    statusById[sent ? r.to : r.from] = { status: sent ? "sent" : "received", requestId: r._id };
  }

  res.json({
    success: true,
    users: users.map((u) => ({ ...u, ...(statusById[u._id] || { status: "none", requestId: null }) })),
  });
};

// Pending requests sent to me and by me
export const getRequests = async (req, res) => {
  const me = req.user._id;
  const [incoming, outgoing] = await Promise.all([
    FriendRequest.find({ to: me }).sort({ createdAt: -1 }).populate("from", PUBLIC_USER_FIELDS).lean(),
    FriendRequest.find({ from: me }).sort({ createdAt: -1 }).populate("to", PUBLIC_USER_FIELDS).lean(),
  ]);

  // Skip requests whose other user was deleted
  res.json({
    success: true,
    incoming: incoming.filter((r) => r.from).map((r) => ({ _id: r._id, user: r.from, createdAt: r.createdAt })),
    outgoing: outgoing.filter((r) => r.to).map((r) => ({ _id: r._id, user: r.to, createdAt: r.createdAt })),
  });
};

// Send a friend request. If they already asked me, this accepts theirs.
export const sendRequest = async (req, res) => {
  const me = req.user;
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) return bad(res, 400, "Invalid user id");
  if (me._id.equals(userId)) return bad(res, 400, "You can't add yourself");
  if (isFriend(me, userId)) return bad(res, 409, "You're already friends");

  const target = await publicUser(userId);
  if (!target) return bad(res, 404, "User not found");

  const theirRequest = await FriendRequest.findOne({ from: userId, to: me._id });
  if (theirRequest) {
    await makeFriends(me._id, target._id);
    emitToUser(userId, "friendRequestAccepted", {
      requestId: theirRequest._id,
      user: await publicUser(me._id),
    });
    return res.json({ success: true, accepted: true, user: target, message: "You're now friends" });
  }

  let request;
  try {
    request = await FriendRequest.create({ from: me._id, to: userId });
  } catch (err) {
    if (err.code === 11000) return bad(res, 409, "Request already sent");
    throw err;
  }

  const payload = { _id: request._id, createdAt: request.createdAt };
  emitToUser(userId, "friendRequest", { ...payload, user: await publicUser(me._id) });

  res.status(201).json({
    success: true,
    request: { ...payload, user: target },
    message: "Friend request sent",
  });
};

// Accept a request sent to me
export const acceptRequest = async (req, res) => {
  const me = req.user._id;
  const { requestId } = req.params;
  if (!mongoose.isValidObjectId(requestId)) return bad(res, 400, "Invalid request id");

  const request = await FriendRequest.findOne({ _id: requestId, to: me });
  if (!request) return bad(res, 404, "Request not found");

  const sender = await publicUser(request.from);
  if (!sender) {
    await request.deleteOne();
    return bad(res, 404, "This user no longer exists");
  }

  await makeFriends(me, request.from);
  emitToUser(request.from, "friendRequestAccepted", {
    requestId: request._id,
    user: await publicUser(me),
  });

  res.json({ success: true, user: sender, message: `You and ${sender.fullName} are now friends` });
};

// Decline a request sent to me
export const declineRequest = async (req, res) => {
  const { requestId } = req.params;
  if (!mongoose.isValidObjectId(requestId)) return bad(res, 400, "Invalid request id");

  const request = await FriendRequest.findOneAndDelete({ _id: requestId, to: req.user._id });
  if (!request) return bad(res, 404, "Request not found");

  emitToUser(request.from, "friendRequestRemoved", { requestId: request._id });
  res.json({ success: true });
};

// Cancel a request I sent
export const cancelRequest = async (req, res) => {
  const { requestId } = req.params;
  if (!mongoose.isValidObjectId(requestId)) return bad(res, 400, "Invalid request id");

  const request = await FriendRequest.findOneAndDelete({ _id: requestId, from: req.user._id });
  if (!request) return bad(res, 404, "Request not found");

  emitToUser(request.to, "friendRequestRemoved", { requestId: request._id });
  res.json({ success: true });
};

// Remove a friend. Message history is kept, but neither side can message
// the other until they become friends again.
export const removeFriend = async (req, res) => {
  const me = req.user._id;
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) return bad(res, 400, "Invalid user id");

  await Promise.all([
    User.updateOne({ _id: me }, { $pull: { friends: userId } }),
    User.updateOne({ _id: userId }, { $pull: { friends: me } }),
  ]);

  emitToUser(userId, "friendRemoved", { userId: String(me) });
  res.json({ success: true, message: "Friend removed" });
};
