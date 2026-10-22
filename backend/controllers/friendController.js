import mongoose from "mongoose";
import User, { PUBLIC_USER_FIELDS } from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import Report, { REPORT_REASONS } from "../models/report.model.js";
import { emitToUser } from "../lib/socket.js";

const DISCOVER_LIMIT = 50;

const bad = (res, status, message) => res.status(status).json({ success: false, message });

const isFriend = (user, otherId) => user.friends.some((id) => id.equals(otherId));

const hasBlocked = (user, otherId) => (user.blocked || []).some((id) => id.equals(otherId));

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

// A user who exists and hasn't blocked me. People who blocked you are treated
// as if they don't exist, so you can't tell you were blocked.
const visibleUser = (id, me, fields = PUBLIC_USER_FIELDS) =>
  User.findOne({ _id: id, blocked: { $ne: me._id } }).select(fields).lean();

// People you aren't friends with yet, newest first, with the request status
// between you: "none", "sent" (you asked them) or "received" (they asked you)
export const discoverUsers = async (req, res) => {
  const me = req.user;
  const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 50) : "";

  // Skip friends, people I blocked and people who blocked me
  const filter = {
    _id: { $nin: [me._id, ...me.friends, ...(me.blocked || [])] },
    blocked: { $ne: me._id },
  };
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
  if (hasBlocked(me, userId)) return bad(res, 403, "Unblock this person to send a friend request");

  const target = await visibleUser(userId, me);
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

// Public profile of any user, with friend count, mutual friends and how the
// two of you are connected: "self", "friends", "sent", "received" or "none"
export const getProfile = async (req, res) => {
  const me = req.user;
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) return bad(res, 400, "Invalid user id");

  const user = await visibleUser(userId, me, `${PUBLIC_USER_FIELDS} friends createdAt`);
  if (!user) return bad(res, 404, "User not found");

  const myFriends = new Set(me.friends.map(String));
  const mutualIds = user.friends.filter((id) => myFriends.has(String(id)));

  let relationship = "none";
  let requestId = null;
  if (me._id.equals(user._id)) relationship = "self";
  else if (hasBlocked(me, user._id)) relationship = "blocked";
  else if (myFriends.has(String(user._id))) relationship = "friends";
  else {
    const request = await FriendRequest.findOne({
      $or: [
        { from: me._id, to: user._id },
        { from: user._id, to: me._id },
      ],
    }).lean();
    if (request) {
      relationship = request.from.equals(me._id) ? "sent" : "received";
      requestId = request._id;
    }
  }

  const hideMutual = relationship === "self" || relationship === "blocked";
  const mutualPreview = hideMutual ? [] : await User.find({ _id: { $in: mutualIds.slice(0, 5) } })
    .select("fullName username profilePic")
    .lean();

  const { friends, ...profile } = user;
  res.json({
    success: true,
    profile: {
      ...profile,
      friendCount: friends.length,
      mutualCount: hideMutual ? 0 : mutualIds.length,
      mutualFriends: mutualPreview,
      relationship,
      requestId,
    },
  });
};

// Block someone: unfriend them, cancel pending requests both ways, and stop
// them from finding me, seeing my profile or sending new requests.
const block = async (me, userId) => {
  const between = { $or: [{ from: me._id, to: userId }, { from: userId, to: me._id }] };
  const requests = await FriendRequest.find(between).select("_id").lean();

  await Promise.all([
    User.updateOne({ _id: me._id }, { $addToSet: { blocked: userId }, $pull: { friends: userId } }),
    User.updateOne({ _id: userId }, { $pull: { friends: me._id } }),
    FriendRequest.deleteMany(between),
  ]);

  // Update both sides' screens (my other tabs too) with the usual events.
  // The other person just sees the friendship/request disappear.
  emitToUser(userId, "friendRemoved", { userId: String(me._id) });
  emitToUser(me._id, "friendRemoved", { userId: String(userId) });
  for (const r of requests) {
    emitToUser(userId, "friendRequestRemoved", { requestId: r._id });
    emitToUser(me._id, "friendRequestRemoved", { requestId: r._id });
  }
};

export const blockUser = async (req, res) => {
  const me = req.user;
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) return bad(res, 400, "Invalid user id");
  if (me._id.equals(userId)) return bad(res, 400, "You can't block yourself");
  if (!(await User.exists({ _id: userId }))) return bad(res, 404, "User not found");

  await block(me, userId);
  res.json({ success: true, message: "User blocked" });
};

export const unblockUser = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) return bad(res, 400, "Invalid user id");

  await User.updateOne({ _id: req.user._id }, { $pull: { blocked: userId } });
  res.json({ success: true, message: "User unblocked" });
};

// People I've blocked
export const getBlockedUsers = async (req, res) => {
  const users = await User.find({ _id: { $in: req.user.blocked || [] } })
    .select("username fullName profilePic")
    .lean();
  res.json({ success: true, users });
};

// Report someone, optionally blocking them at the same time
export const reportUser = async (req, res) => {
  const me = req.user;
  const { userId } = req.params;
  const { reason } = req.body;
  const details = typeof req.body.details === "string" ? req.body.details.trim().slice(0, 1000) : "";

  if (!mongoose.isValidObjectId(userId)) return bad(res, 400, "Invalid user id");
  if (me._id.equals(userId)) return bad(res, 400, "You can't report yourself");
  if (!REPORT_REASONS.includes(reason)) return bad(res, 400, "Please choose a reason");
  if (reason === "other" && !details) return bad(res, 400, "Please describe the problem");
  if (!(await User.exists({ _id: userId }))) return bad(res, 404, "User not found");

  await Report.create({ reporter: me._id, reported: userId, reason, details });

  const alsoBlock = req.body.block === true;
  if (alsoBlock) await block(me, userId);

  res.status(201).json({
    success: true,
    blocked: alsoBlock,
    message: alsoBlock ? "Report sent and user blocked" : "Thanks, your report was sent",
  });
};
