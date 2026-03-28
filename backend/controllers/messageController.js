// এইটা হচ্ছে কনভার্সেশন মডেল (কথোপকথনগুলো কোথায় রাখবো)
import Conversation from "../models/conversationModel.js";
// এইটা হচ্ছে মেসেজ মডেল (মেসেজগুলো কোথায় রাখবো)
import Message from "../models/messageModel.js";
// এইটা দিয়ে রিয়েল টাইমে মেসেজ পাঠানো যায়
import { getRecipientSocketId, io } from "../socket/socket.js";
// এইটা দিয়ে ছবি ক্লাউডে আপলোড করা যায়
import { v2 as cloudinary } from "cloudinary";

// ============= মেসেজ পাঠানোর ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ মেসেজ পাঠায়
async function sendMessage(req, res) {
	try {
		// ইউজার যা পাঠিয়েছে সেগুলো নিচ্ছি
		// recipientId = কার কাছে পাঠাবে
		// message = কি লেখা আছে
		const { recipientId, message } = req.body;
		// img = ছবি থাকলে সেটাও নিচ্ছি (না-ও থাকতে পারে)
		let { img } = req.body;
		// senderId = যে মেসেজ পাঠাচ্ছে (লগইন করা ইউজার)
		const senderId = req.user._id;

		// খুঁজে দেখি এই দুইজনের মধ্যে আগে থেকে কোনো কথোপকথন আছে কিনা
		// participants = যারা এই কথোপকথনে অংশ নিচ্ছে
		// $all মানে দুইজনই যেন থাকে
		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, recipientId] },
		});

		// যদি কোনো কথোপকথন না থাকে
		if (!conversation) {
			// তাহলে নতুন একটা কথোপকথন বানাই
			conversation = new Conversation({
				// এই দুইজন হবে এই কথোপকথনের অংশগ্রহণকারী
				participants: [senderId, recipientId],
				// সর্বশেষ মেসেজটা কী ছিল সেটা মনে রাখি
				lastMessage: {
					text: message,
					sender: senderId,
				},
			});
			// এই নতুন কথোপকথনটা ডাটাবেজে সংরক্ষণ করি
			await conversation.save();
		}

		// যদি ইউজার ছবি দিয়ে থাকে
		if (img) {
			// ছবিটাকে ক্লাউডিনারিতে আপলোড করি
			const uploadedResponse = await cloudinary.uploader.upload(img);
			// আপলোড হওয়া ছবির লিংকটা নিই
			img = uploadedResponse.secure_url;
		}

		// এখন নতুন মেসেজটা তৈরি করি
		const newMessage = new Message({
			// এই মেসেজ কোন কথোপকথনের জন্য
			conversationId: conversation._id,
			// কে পাঠিয়েছে
			sender: senderId,
			// মেসেজে কি লেখা আছে
			text: message,
			// ছবি থাকলে ছবির লিংক, না থাকলে খালি
			img: img || "",
		});

		// দুইটা কাজ একসাথে করবো (যাতে দ্রুত হয়)
		await Promise.all([
			// কাজ ১: নতুন মেসেজটা ডাটাবেজে সংরক্ষণ করি
			newMessage.save(),
			// কাজ ২: কথোপকথনের "সর্বশেষ মেসেজ" আপডেট করি
			conversation.updateOne({
				lastMessage: {
					text: message,
					sender: senderId,
				},
			}),
		]);

		// দেখি যে ইউজারকে মেসেজ পাঠাচ্ছি সে অনলাইনে আছে কিনা
		const recipientSocketId = getRecipientSocketId(recipientId);
		// যদি অনলাইনে থাকে
		if (recipientSocketId) {
			// তাহলে সাথে সাথেই ওর কাছে মেসেজটা পৌঁছে দিই (রিয়েল টাইমে)
			io.to(recipientSocketId).emit("newMessage", newMessage);
		}

		// সবকিছু ঠিক থাকলে সফল মেসেজটা রিটার্ন করি
		res.status(201).json(newMessage);
	} catch (error) {
		// যদি কোনো সমস্যা হয়, তাহলে error মেসেজ দেখাই
		res.status(500).json({ error: error.message });
	}
}

// ============= মেসেজগুলো দেখার ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ পুরনো মেসেজ দেখতে চায়
async function getMessages(req, res) {
	// URL থেকে অন্য ইউজারের আইডি নিচ্ছি (যার সাথে কথা বলেছিল)
	const { otherUserId } = req.params;
	// বর্তমান ইউজারের আইডি (লগইন করা ইউজার)
	const userId = req.user._id;
	try {
		// এই দুইজনের মধ্যে কথোপকথন খুঁজি
		const conversation = await Conversation.findOne({
			participants: { $all: [userId, otherUserId] },
		});

		// যদি কথোপকথনই না পাওয়া যায়
		if (!conversation) {
			// তাহলে বলি "কথোপকথন পাওয়া যায়নি"
			return res.status(404).json({ error: "Conversation not found" });
		}

		// যদি কথোপকথন পাওয়া যায়, তাহলে ওই কথোপকথনের সব মেসেজ খুঁজি
		const messages = await Message.find({
			conversationId: conversation._id,
			// createdAt 1 মানে পুরনোটা আগে, নতুনটা পরে (যেমনটা দেখানো উচিত)
		}).sort({ createdAt: 1 });

		// সব মেসেজ ইউজারকে দেখাই
		res.status(200).json(messages);
	} catch (error) {
		// কোনো সমস্যা হলে error দেখাই
		res.status(500).json({ error: error.message });
	}
}

// ============= সব কথোপকথন দেখার ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ দেখতে চায় কার সাথে কার সাথে কথা বলেছে
async function getConversations(req, res) {
	// বর্তমান ইউজারের আইডি (লগইন করা ইউজার)
	const userId = req.user._id;
	try {
		// বর্তমান ইউজার যতগুলো কথোপকথনে আছে সব খুঁজি
		const conversations = await Conversation.find({ participants: userId }).populate({
			// participants এর পুরো তথ্য আনবো (শুধু আইডি না)
			path: "participants",
			// শুধু ইউজারনেম আর প্রোফাইল পিকচার আনবো
			select: "username profilePic",
		});

		// প্রতিটি কথোপকথনের জন্য
		conversations.forEach((conversation) => {
			// participants লিস্ট থেকে বর্তমান ইউজারকে বাদ দিয়ে দিই
			// কারণ নিজের নাম দেখানোর দরকার নেই
			conversation.participants = conversation.participants.filter(
				(participant) => participant._id.toString() !== userId.toString()
			);
		});
		// সব কথোপকথন ইউজারকে দেখাই
		res.status(200).json(conversations);
	} catch (error) {
		// কোনো সমস্যা হলে error দেখাই
		res.status(500).json({ error: error.message });
	}
}

// এই তিনটা ফাংশন অন্য জায়গায় ব্যবহার করার জন্য export করি
export { sendMessage, getMessages, getConversations };