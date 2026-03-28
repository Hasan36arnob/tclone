// mongoose আনা হচ্ছে (MongoDB এর সাথে কাজ করার জন্য)
import mongoose from "mongoose";

// ============= পোস্টের স্ট্রাকচার (Schema) তৈরি =============
// postSchema মানে: "একটা পোস্ট দেখতে কেমন হবে?"
const postSchema = mongoose.Schema(
	{
		// ============= কে পোস্ট করেছে? =============
		// postedBy = এই পোস্টটা কে লিখেছে?
		// ref: "User" মানে User মডেলের সাথে সম্পর্কিত
		// required: true মানে এটা অবশ্যই দিতে হবে
		postedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		
		// ============= পোস্টের লেখা =============
		// text = পোস্টে কি লেখা আছে?
		// maxLength: 500 মানে সর্বোচ্চ 500 অক্ষর লেখা যাবে
		text: {
			type: String,
			maxLength: 500,
		},
		
		// ============= ছবি/ভিডিও =============
		// img = পোস্টে ছবি বা ভিডিও থাকলে সেটার লিংক
		img: {
			type: String,
		},
		
		// ============= মিডিয়ার টাইপ =============
		// mediaType = এটা ছবি নাকি ভিডিও?
		// enum মানে শুধু "image" বা "video" হতে পারবে
		mediaType: {
			type: String,
			enum: ["image", "video"],
		},
		
		// ============= লাইক =============
		// likes = কারা কারা এই পোস্টে লাইক দিয়েছে?
		// এটা হবে ইউজার আইডিগুলোর লিস্ট
		likes: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
			default: [],  // নতুন পোস্টে লাইক ০
		},
		
		// ============= কমেন্ট (রিপ্লাই) =============
		// replies = এই পোস্টে কারা কি কি কমেন্ট করেছে?
		replies: [
			{
				// userId = কে কমেন্ট করেছে?
				userId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				// text = কমেন্টে কি লেখা আছে?
				text: {
					type: String,
					required: true,
				},
				// userProfilePic = কমেন্টকারীর প্রোফাইল ছবি
				userProfilePic: {
					type: String,
				},
				// username = কমেন্টকারীর ইউজারনেম
				username: {
					type: String,
				},
			},
		],
	},
	{
		// timestamps: true মানে:
		// "এই পোস্ট কখন তৈরি হয়েছে আর কখন আপডেট হয়েছে
		//  MongoDB নিজে নিজে ম্যানেজ করবে"
		timestamps: true,
	}
);

// Schema থেকে Post মডেল তৈরি করি
// এই মডেল দিয়েই আমরা ডাটাবেজে Post সংক্রান্ত কাজ করবো
const Post = mongoose.model("Post", postSchema);

// Post মডেলটাকে অন্য জায়গায় ব্যবহারের জন্য export করি
export default Post;