// mongoose আনা হচ্ছে (MongoDB এর সাথে কাজ করার জন্য)
import mongoose from "mongoose";

// ============= মেসেজের স্ট্রাকচার (Schema) তৈরি =============
// messageSchema মানে: "একটা মেসেজ দেখতে কেমন হবে?"
const messageSchema = new mongoose.Schema(
	{
		// ============= কোন কথোপকথনের মেসেজ? =============
		// conversationId = এই মেসেজটা কোন চ্যাটের?
		// ref: "Conversation" মানে Conversation মডেলের সাথে সম্পর্কিত
		conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
		
		// ============= কে পাঠিয়েছে? =============
		// sender = এই মেসেজ কে লিখেছে?
		// ref: "User" মানে User মডেলের সাথে সম্পর্কিত
		sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		
		// ============= মেসেজের লেখা =============
		// text = মেসেজে কি লেখা আছে?
		text: String,
		
		// ============= দেখা হয়েছে কিনা? =============
		// seen = রিসিভার কি মেসেজটা দেখেছে?
		seen: {
			type: Boolean,
			default: false,  // নতুন মেসেজ default দেখা হয়নি
		},
		
		// ============= ছবি থাকলে =============
		// img = মেসেজে ছবি থাকলে সেটার লিংক
		img: {
			type: String,
			default: "",  // ছবি না থাকলে খালি স্ট্রিং
		},
	},
	// timestamps: true মানে:
	// "এই মেসেজ কখন পাঠানো হয়েছে আর কখন আপডেট হয়েছে
	//  MongoDB নিজে নিজে ম্যানেজ করবে"
	{ timestamps: true }
);

// Schema থেকে Message মডেল তৈরি করি
// এই মডেল দিয়েই আমরা ডাটাবেজে Message সংক্রান্ত কাজ করবো
const Message = mongoose.model("Message", messageSchema);

// Message মডেলটাকে অন্য জায়গায় ব্যবহারের জন্য export করি
export default Message;