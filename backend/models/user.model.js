import mongoose from "mongoose";
import { formatName } from "../lib/validation.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Unique public handle, e.g. "aditya.meena". Sparse so accounts created
    // before usernames existed are allowed until the migration fills them in.
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      maxlength: 20,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      set: formatName, // always stored as "Aditya Meena", whatever was typed
    },
    password: {
      type: String,
      required: true,
      select: false, // never returned unless explicitly asked for
    },
    profilePic: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    // Accepted friends: only these people show up in the chat list
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // make sure the password hash never leaves the server
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.friends; // a user's friend list is private
        return ret;
      },
    },
  }
);

const User = mongoose.model("User", userSchema);

export default User;

// Fields that are safe to show about other people
export const PUBLIC_USER_FIELDS = "username fullName profilePic bio lastSeen";
