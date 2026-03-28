// পোস্ট মডেল আনা হচ্ছে (পোস্টগুলো কোথায় রাখবো)
import Post from "../models/postModel.js";
// ইউজার মডেল আনা হচ্ছে (ইউজারের তথ্য কোথায় রাখবো)
import User from "../models/userModel.js";
// ক্লাউডিনারি আনা হচ্ছে (ছবি ও ভিডিও আপলোড করার জন্য)
import { v2 as cloudinary } from "cloudinary";

// ============= নতুন পোস্ট তৈরি করার ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ নতুন পোস্ট করে
const createPost = async (req, res) => {
	try {
		// ইউজার যা পাঠিয়েছে সেগুলো নিচ্ছি
		// postedBy = কে পোস্ট করছে
		// text = পোস্টে কি লেখা আছে
		const { postedBy, text } = req.body;
		// img = ছবি থাকলে সেটাও নিচ্ছি (না-ও থাকতে পারে)
		let { img } = req.body;
		// mediaType = এটা ছবি নাকি ভিডিও (পরে বের করবো)
		let mediaType = undefined;

		// postedBy আর text না দিলে পোস্ট করা যাবে না
		if (!postedBy || !text) {
			return res.status(400).json({ error: "Postedby and text fields are required" });
		}

		// postedBy এর আইডি দিয়ে ইউজার খুঁজি
		const user = await User.findById(postedBy);
		// যদি ইউজার না পাওয়া যায়
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// যে পোস্ট করছে সি কি আসলেই লগইন করা ইউজার?
		// কেউ অন্য কারো নামে পোস্ট করতে পারবে না
		if (user._id.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to create post" });
		}

		// পোস্টের লেখা কত বড় হতে পারে?
		const maxLength = 500;
		// যদি ৫০০ অক্ষরের বেশি হয়
		if (text.length > maxLength) {
			return res.status(400).json({ error: `Text must be less than ${maxLength} characters` });
		}

		// ============= ছবি বা ভিডিও আপলোড করা =============
		// যদি ফাইল (ছবি/ভিডিও) দিয়ে থাকে
		if (req.file) {
			// ক্লাউডিনারিতে আপলোড করি (ভিডিও ও ছবি দুইটাই সাপোর্ট করে)
			const uploadResult = await new Promise((resolve, reject) => {
				const stream = cloudinary.uploader.upload_stream({ resource_type: "auto" }, (error, result) => {
					if (error) return reject(error);
					return resolve(result);
				});
				stream.end(req.file.buffer);
			});
			// আপলোড হওয়া ফাইলের লিংকটা নিই
			img = uploadResult.secure_url;
			// এটা ভিডিও নাকি ছবি সেটা মনে রাখি
			mediaType = uploadResult.resource_type === "video" ? "video" : "image";
		} 
		// যদি পুরনো পদ্ধতিতে ছবি দিয়ে থাকে (base64 ফরম্যাটে)
		else if (img) {
			// ক্লাউডিনারিতে আপলোড করি (শুধু ছবি)
			const uploadedResponse = await cloudinary.uploader.upload(img, { resource_type: "image" });
			img = uploadedResponse.secure_url;
			mediaType = "image";
		}

		// নতুন পোস্ট তৈরি করি
		const newPost = new Post({ postedBy, text, img, mediaType });
		// ডাটাবেজে সেভ করি
		await newPost.save();

		// সফলভাবে পোস্ট হয়েছে দেখাই
		res.status(201).json(newPost);
	} catch (err) {
		// কোনো সমস্যা হলে error দেখাই
		res.status(500).json({ error: err.message });
		console.log(err);
	}
};

// ============= একটা পোস্ট দেখার ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ একটা নির্দিষ্ট পোস্ট দেখতে চায়
const getPost = async (req, res) => {
	try {
		// URL থেকে পোস্টের আইডি নিয়ে পোস্ট খুঁজি
		const post = await Post.findById(req.params.id);

		// যদি পোস্ট না পাওয়া যায়
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// পোস্টটা দেখাই
		res.status(200).json(post);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// ============= পোস্ট ডিলিট করার ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ নিজের পোস্ট ডিলিট করে
const deletePost = async (req, res) => {
	try {
		// কোন পোস্ট ডিলিট করতে চায় সেটা খুঁজি
		const post = await Post.findById(req.params.id);
		// যদি পোস্ট না পাওয়া যায়
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// শুধু পোস্টের মালিকই ডিলিট করতে পারবে
		if (post.postedBy.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to delete post" });
		}

		// যদি পোস্টে ছবি/ভিডিও থাকে
		if (post.img) {
			// ছবির আইডি বের করি (ক্লাউড থেকে ডিলিট করার জন্য)
			const imgId = post.img.split("/").pop().split(".")[0];
			// ক্লাউড থেকে ছবি ডিলিট করি
			await cloudinary.uploader.destroy(imgId);
		}

		// ডাটাবেজ থেকে পোস্ট ডিলিট করি
		await Post.findByIdAndDelete(req.params.id);

		// সফলভাবে ডিলিট হয়েছে জানাই
		res.status(200).json({ message: "Post deleted successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// ============= লাইক/আনলাইক করার ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ পোস্টে লাইক দেয় বা লাইক তুলে নেয়
const likeUnlikePost = async (req, res) => {
	try {
		// URL থেকে পোস্টের আইডি নিচ্ছি
		const { id: postId } = req.params;
		// কে লাইক দিচ্ছে
		const userId = req.user._id;

		// পোস্টটা খুঁজি
		const post = await Post.findById(postId);

		// যদি পোস্ট না পাওয়া যায়
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// দেখি এই ইউজার আগে থেকে লাইক দিয়েছে কিনা
		const userLikedPost = post.likes.includes(userId);

		// যদি আগে লাইক দিয়ে থাকে
		if (userLikedPost) {
			// তাহলে লাইক তুলে নেবো (আনলাইক)
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			res.status(200).json({ message: "Post unliked successfully" });
		} else {
			// যদি লাইক না দিয়ে থাকে, তাহলে লাইক দেবো
			post.likes.push(userId);
			await post.save();
			res.status(200).json({ message: "Post liked successfully" });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// ============= পোস্টে রিপ্লাই করার ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ কোনো পোস্টে মন্তব্য করে
const replyToPost = async (req, res) => {
	try {
		// রিপ্লাইয়ের লেখা
		const { text } = req.body;
		// কোন পোস্টে রিপ্লাই করবে
		const postId = req.params.id;
		// কে রিপ্লাই করছে
		const userId = req.user._id;
		// রিপ্লাইকারীর প্রোফাইল পিক
		const userProfilePic = req.user.profilePic;
		// রিপ্লাইকারীর ইউজারনেম
		const username = req.user.username;

		// লেখা না দিলে রিপ্লাই করা যাবে না
		if (!text) {
			return res.status(400).json({ error: "Text field is required" });
		}

		// পোস্টটা খুঁজি
		const post = await Post.findById(postId);
		// যদি পোস্ট না পাওয়া যায়
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// নতুন রিপ্লাই তৈরি করি
		const reply = { userId, text, userProfilePic, username };

		// পোস্টের রিপ্লাই লিস্টে যোগ করি
		post.replies.push(reply);
		// পোস্ট আপডেট করি
		await post.save();

		// রিপ্লাইটা দেখাই
		res.status(200).json(reply);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// ============= ফিড পোস্ট দেখার ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ হোম পেজে যারা ফলো করে তাদের পোস্ট দেখতে চায়
const getFeedPosts = async (req, res) => {
	try {
		// লগইন করা ইউজার
		const userId = req.user._id;
		// ইউজারের তথ্য খুঁজি
		const user = await User.findById(userId);
		// যদি ইউজার না পাওয়া যায়
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// ইউজার যাদের ফলো করে
		const following = user.following;
		// যাদের ফলো করে + নিজেও (নিজের পোস্টও দেখাবে)
		const followingPlusSelf = [...following, userId];

		// এই ইউজারদের সব পোস্ট খুঁজি, নতুনটা আগে দেখাবো
		const feedPosts = await Post.find({ postedBy: { $in: followingPlusSelf } }).sort({ createdAt: -1 });

		// পোস্টগুলো দেখাই
		res.status(200).json(feedPosts);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// ============= নির্দিষ্ট ইউজারের পোস্ট দেখার ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ কারো প্রোফাইলে গিয়ে ওর পোস্ট দেখতে চায়
const getUserPosts = async (req, res) => {
	// URL থেকে ইউজারনেম নিচ্ছি
	const { username } = req.params;
	try {
		// ইউজারনেম দিয়ে ইউজার খুঁজি
		const user = await User.findOne({ username });
		// যদি ইউজার না পাওয়া যায়
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// ওই ইউজারের সব পোস্ট খুঁজি, নতুনটা আগে দেখাবো
		const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });

		// পোস্টগুলো দেখাই
		res.status(200).json(posts);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// সব ফাংশন অন্য জায়গায় ব্যবহারের জন্য export করি
export { createPost, getPost, deletePost, likeUnlikePost, replyToPost, getFeedPosts, getUserPosts };