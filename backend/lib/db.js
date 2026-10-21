import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Connect to MongoDB. Throws if the connection fails so the server doesn't
// start in a broken state.
export const connectDB = async () => {
  mongoose.connection.on("connected", () => console.log("Database connected"));
  mongoose.connection.on("error", (err) => console.error("Database error:", err.message));

  await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });
};
