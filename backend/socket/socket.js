import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";

const app = express();
const server = http.createServer(app);

// CORS configuration for Socket.IO
const corsOptions = {
	origin: process.env.NODE_ENV === "production" 
		? process.env.CLIENT_URL || "http://localhost:3000"
		: ["http://localhost:3000", "http://localhost:5173"],
	methods: ["GET", "POST"],
	credentials: true,
};

const io = new Server(server, {
	cors: corsOptions,
	pingTimeout: 60000,
	pingInterval: 25000,
});

export const getRecipientSocketId = (recipientId) => {
	return userSocketMap[recipientId];
};

const userSocketMap = {}; // userId: socketId

// Socket.IO connection handler
io.on("connection", (socket) => {
	console.log("User connected:", socket.id);
	
	const userId = socket.handshake.query.userId;

	// Validate userId
	if (userId && userId !== "undefined" && userId !== "null") {
		userSocketMap[userId] = socket.id;
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	}

	// Mark messages as seen
	socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
		try {
			// Validate inputs
			if (!conversationId || !userId) {
				console.error("Invalid parameters for markMessagesAsSeen");
				return;
			}

			await Message.updateMany(
				{ conversationId: conversationId, seen: false }, 
				{ $set: { seen: true } }
			);
			await Conversation.updateOne(
				{ _id: conversationId }, 
				{ $set: { "lastMessage.seen": true } }
			);
			
			const recipientSocketId = userSocketMap[userId];
			if (recipientSocketId) {
				io.to(recipientSocketId).emit("messagesSeen", { conversationId });
			}
		} catch (error) {
			console.error("Error in markMessagesAsSeen:", error.message);
		}
	});

	// Handle disconnection
	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);
		
		// Find and remove the user from the map
		for (const [uid, socketId] of Object.entries(userSocketMap)) {
			if (socketId === socket.id) {
				delete userSocketMap[uid];
				break;
			}
		}
		
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	});

	// Handle errors
	socket.on("error", (error) => {
		console.error("Socket error:", error);
	});
});

// Handle IO errors
io.engine.on("connection_error", (err) => {
	console.error("Socket.IO connection error:", err.message);
});

export { io, server, app };
