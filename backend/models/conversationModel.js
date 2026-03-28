// mongoose আনা হচ্ছে (MongoDB এর সাথে কাজ করার জন্য)
import mongoose from "mongoose";

// ============= কথোপকথনের স্ট্রাকচার (Schema) তৈরি =============
// conversationSchema মানে: "একটা কথোপকথন দেখতে কেমন হবে?"
const conversationSchema = new mongoose.Schema(
	{
		// ============= অংশগ্রহণকারীরা =============
		// participants = এই কথোপকথনে কারা কারা আছে?
		// [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] মানে:
		// এটা হবে ইউজারদের আইডির লিস্ট (যেমন: [ইউজার১, ইউজার২])
		participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		
		// ============= সর্বশেষ মেসেজ =============
		// lastMessage = সবশেষ কি কথাটা হয়েছে?
		lastMessage: {
			// text = শেষ মেসেজে কি লেখা ছিল?
			text: String,
			// sender = কে শেষ মেসেজটা পাঠিয়েছে?
			sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
			// seen = শেষ মেসেজটা দেখা হয়েছে কিনা?
			seen: {
				type: Boolean,
				default: false, // নতুন মেসেজ আসলে default দেখা হয়নি
			},
		},
	},
	// timestamps: true মানে:
	// "এই কথোপকথন কখন তৈরি হয়েছে আর কখন শেষবার আপডেট হয়েছে সেটা
	//  MongoDB নিজে নিজে ম্যানেজ করবে"
	{ timestamps: true }
);

// Schema থেকে Conversation মডেল তৈরি করি
// এই মডেল দিয়েই আমরা ডাটাবেজে Conversation সংক্রান্ত কাজ করবো
const Conversation = mongoose.model("Conversation", conversationSchema);

// Conversation মডেলটাকে অন্য জায়গায় ব্যবহারের জন্য export করি
export default Conversation;