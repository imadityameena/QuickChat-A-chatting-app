// One-time fix for names saved before names were auto-formatted.
// Turns "aditya meena" / "ADITYA MEENA" into "Aditya Meena" for every user.
//
// Run once from the backend folder:  npm run migrate:names
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";
import { formatName } from "../lib/validation.js";

await connectDB();

// Read the raw stored values (lean skips the model's setter)
const users = await User.find({}, { fullName: 1 }).lean();
const ops = [];
for (const { _id, fullName } of users) {
  const formatted = formatName(fullName);
  if (formatted && formatted !== fullName) {
    console.log(`  "${fullName}" -> "${formatted}"`);
    ops.push({ updateOne: { filter: { _id }, update: { $set: { fullName: formatted } } } });
  }
}

if (ops.length) await User.bulkWrite(ops);
console.log(`Updated ${ops.length} of ${users.length} name(s).`);
await mongoose.disconnect();
