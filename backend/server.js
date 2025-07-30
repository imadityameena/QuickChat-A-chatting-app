import express from "express";
import { configDotenv } from "dotenv";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db";


//create Express app and HTTP server
const app =  express();
const server = http.createServer(app)

//Middleware setup

app.use(express.json({limit:"4mb"}));
app.use(cors());

app.use("/api/status", (req, res) => res.send("Server is live"));


//connect to mongoDB
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server is running on PORT :" + PORT));
