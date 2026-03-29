// সকেট.আইও সার্ভার আনা হচ্ছে (রিয়েল টাইমে কথা বলার জন্য)
import { Server } from "socket.io";
// এইচটিটিপি সার্ভার আনা হচ্ছে
import http from "http";
// এক্সপ্রেস আনা হচ্ছে
import express from "express";
// মেসেজ মডেল আনা হচ্ছে (মেসেজ ডাটাবেজে রাখার জন্য)
import Message from "../models/messageModel.js";
// কনভার্সেশন মডেল আনা হচ্ছে (কথোপকথন ডাটাবেজে রাখার জন্য)
import Conversation from "../models/conversationModel.js";

// এক্সপ্রেস অ্যাপ বানানো
const app = express();
// এইচটিটিপি সার্ভার বানানো (এক্সপ্রেসকে দিয়ে)
const server = http.createServer(app);

// ============= সকেট.আইও-র জন্য সিআরএস সেটআপ =============
// CORS মানে: কোন ওয়েবসাইট থেকে সংযোগ করতে পারবে
const corsOptions = {
	// প্রোডাকশনে (লাইভ সাইটে) ক্লায়েন্টের ঠিকানা
	origin: process.env.NODE_ENV === "production" 
		? process.env.CLIENT_URL || "http://localhost:3000"
		: ["http://localhost:3000", "http://localhost:5173"],  // ডেভেলপমেন্টে এই ঠিকানা
	methods: ["GET", "POST"],  // কোন পদ্ধতি ব্যবহার করতে পারবে
	credentials: true,        // কুকি পাঠাতে দেবে
};

// সকেট.আইও সার্ভার তৈরি করা
const io = new Server(server, {
	cors: corsOptions,
	pingTimeout: 60000,    // ৬০ সেকেন্ড চুপ থাকলে সংযোগ ছিন্ন করবে
	pingInterval: 25000,   // ২৫ সেকেন্ড পর পর পিং পাঠাবে (সংযোগ আছে কিনা দেখতে)
});

// ============= ইউজারের সকেট আইডি বের করার ফাংশন =============
// কাজ: ইউজারের আইডি দিয়ে ওর সকেট আইডি বের করা
export const getRecipientSocketId = (recipientId) => {
	return userSocketMap[recipientId];
};

// ইউজার সকেট ম্যাপ: ইউজার আইডি → সকেট আইডি
// যেমন: { "user123": "socket_xyz", "user456": "socket_abc" }
const userSocketMap = {};

// ============= সকেট সংযোগ হ্যান্ডলার =============
// নতুন কেউ কানেক্ট করলে এই কোড চলবে
io.on("connection", (socket) => {
	console.log("কেউ কানেক্ট করেছে:", socket.id);
	
	// ইউজার আইডি নিয়ে আসা (কুয়েরি থেকে)
	const userId = socket.handshake.query.userId;

	// ইউজার আইডি ঠিক আছে কিনা চেক করা
	if (userId && userId !== "undefined" && userId !== "null") {
		// এই ইউজারের সাথে এই সকেট আইডি ম্যাপ করে রাখা
		userSocketMap[userId] = socket.id;
		// সবাইকে জানানো: অনলাইনে কারা আছে
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	}

	// ============= মেসেজ সীন মার্ক করা =============
	// যখন কেউ মেসেজ দেখবে, এই ইভেন্ট আসবে
	socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
		try {
			// আইডিগুলো ঠিক আছে কিনা চেক
			if (!conversationId || !userId) {
				console.error("মেসেজ সীন মার্ক করার জন্য দরকারি ডাটা নেই");
				return;
			}

			// এই কথোপকথনের সব মেসেজ আপডেট করা (যেগুলো এখনো সীন হয়নি)
			await Message.updateMany(
				{ conversationId: conversationId, seen: false }, 
				{ $set: { seen: true } }  // সীন true করে দেওয়া
			);
			
			// কথোপকথনের শেষ মেসেজও সীন করে দেওয়া
			await Conversation.updateOne(
				{ _id: conversationId }, 
				{ $set: { "lastMessage.seen": true } }
			);
			
			// রিসিভারের সকেট আইডি বের করা
			const recipientSocketId = userSocketMap[userId];
			
			// রিসিভার অনলাইন থাকলে ওকে জানানো
			if (recipientSocketId) {
				io.to(recipientSocketId).emit("messagesSeen", { conversationId });
			}
		} catch (error) {
			console.error("মেসেজ সীন মার্ক করতে সমস্যা:", error.message);
		}
	});

	// ============= সংযোগ বিচ্ছিন্ন হওয়া =============
	// যখন কেউ ডিসকানেক্ট করবে
	socket.on("disconnect", () => {
		console.log("কেউ ডিসকানেক্ট করেছে:", socket.id);
		
		// ম্যাপ থেকে এই সকেট আইডিটা খুঁজে মুছে ফেলা
		for (const [uid, socketId] of Object.entries(userSocketMap)) {
			if (socketId === socket.id) {
				delete userSocketMap[uid];
				break;
			}
		}
		
		// সবাইকে নতুন অনলাইন লিস্ট পাঠানো
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	});

	// ============= সকেট এরর হ্যান্ডলিং =============
	socket.on("error", (error) => {
		console.error("সকেট এরে:", error);
	});
});

// ============= সংযোগ এরর হ্যান্ডলিং =============
io.engine.on("connection_error", (err) => {
	console.error("সকেট সংযোগ করতে সমস্যা:", err.message);
});

// সবার জন্য আউটপুট
export { io, server, app };