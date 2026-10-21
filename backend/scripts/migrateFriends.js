// One-time migration for the friend-request feature.
// Makes every pair of users who already have messages together friends,
// so existing conversations stay in everyone's chat list.
//
// Run once from the backend folder:  npm run migrate:friends
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

await connectDB();

const pairs = await Message.aggregate([
  { $group: { _id: { a: "$senderId", b: "$receiverId" } } },
]);

const ops = [];
for (const { _id: { a, b } } of pairs) {
  if (String(a) === String(b)) continue;
  ops.push({ updateOne: { filter: { _id: a }, update: { $addToSet: { friends: b } } } });
  ops.push({ updateOne: { filter: { _id: b }, update: { $addToSet: { friends: a } } } });
}

if (ops.length) await User.bulkWrite(ops);
console.log(`Linked ${pairs.length} conversation(s) as friendships.`);
await mongoose.disconnect();
