import express from "express";
import { configDotenv } from "dotenv";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db";
import userRouter from "./routes/userRoutes";
import { Server } from "socket.io";
import { Socket } from "dgram";

configDotenv();

//create Express app and HTTP server
const app =  express();
const server = http.createServer(app)

//Initialize socket.io server

export const io = new Server(server, {
  cors : {origin: "*"}
})

//store online users

export const userSocketMap = {}; // {userId : socketId}

//Socket.io connection handler

io.on("connection", (Socket) => {
  const userId = Socket.handshake.query.userId;
  console.log("User connected", userId);

  if(userId) userSocketMap[userId] = Socket.id;

  //emit online users to all connected clients

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  Socket.on("disconnect", () => {
    console.log("User disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap))
    
  })


})


//Middleware setup

app.use(express.json({limit:"4mb"}));
app.use(cors());


//Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter);





//connect to mongoDB
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server is running on PORT :" + PORT));




//export server for vercel
export default server;