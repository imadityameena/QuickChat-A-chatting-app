// One-time migration: give every existing user without a username one,
// based on their name (e.g. "Aditya Meena" -> "aditya.meena", or
// "aditya.meena42" if that's taken). Users can change it later on their profile.
//
// Run once from the backend folder:  npm run migrate:usernames
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";
import { suggestUsernames } from "../lib/username.js";

await connectDB();
await User.syncIndexes(); // make sure the unique username index exists

const users = await User.find({ username: { $in: [null, ""] } }, { fullName: 1 }).lean();
for (const { _id, fullName } of users) {
  // Try a few times in case two users race for the same name
  for (let attempt = 0; attempt < 5; attempt++) {
    const [username] = await suggestUsernames(fullName, 1);
    try {
      await User.updateOne({ _id }, { $set: { username } });
      console.log(`  ${fullName} -> @${username}`);
      break;
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
}

console.log(`Gave usernames to ${users.length} user(s).`);
await mongoose.disconnect();
