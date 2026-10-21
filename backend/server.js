import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import { initSocket } from "./lib/socket.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import friendRouter from "./routes/friendRoutes.js";

// Fail fast if required configuration is missing
const missingEnv = ["MONGODB_URI", "JWT_SECRET"].filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

// Allowed frontend origins, e.g. CLIENT_URL=http://localhost:5173,https://myapp.vercel.app
const corsOrigin = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : "*";

// Create Express app, HTTP server and Socket.io server
const app = express();
const server = http.createServer(app);
initSocket(server, corsOrigin);

// Middleware
app.set("trust proxy", 1); // real client IPs behind Vercel / proxies (used by the rate limiter)
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "8mb" })); // room for base64 images up to ~5MB

// Routes
app.get("/api/status", (req, res) => res.send("server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/friends", friendRouter);

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Central error handler (Express 5 forwards async errors here)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "File is too large" });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON body" });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, message: err.message });
  }
  console.error(err);
  res.status(500).json({ success: false, message: "Something went wrong, please try again" });
});

// Connect to MongoDB, then start listening
try {
  await connectDB();
} catch (error) {
  console.error("Unable to connect to the database:", error.message);
  process.exit(1);
}

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server is running on PORT: ${PORT}`));
}

// Export server for Vercel
export default server;
