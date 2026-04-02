// ইউজার মডেল আনা হচ্ছে (ইউজারের তথ্য কোথায় রাখবো)
import User from "../models/userModel.js";
// পোস্ট মডেল আনা হচ্ছে (পোস্টগুলো কোথায় রাখবো)
import Post from "../models/postModel.js";
// bcrypt আনা হচ্ছে (পাসওয়ার্ড এনক্রিপ্ট করার জন্য)
import bcrypt from "bcryptjs";
// টোকেন জেনারেট করার ফাংশন আনা হচ্ছে
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
// ক্লাউডিনারি আনা হচ্ছে (প্রোফাইল ছবি আপলোড করার জন্য)
import { v2 as cloudinary } from "cloudinary";
// mongoose আনা হচ্ছে (আইডি চেক করার জন্য)
import mongoose from "mongoose";

// ============= ইনপুট ভ্যালিডেশন হেল্পার ফাংশন =============
//input validation
const validateEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

const validateUsername = (username) => {
	// Username: 3-20 characters, alphanumeric and underscores only
	const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
	return usernameRegex.test(username);
};

const validatePassword = (password) => {
	// Password: minimum 6 characters
	return password && password.length >= 6;
};

const sanitizeInput = (input) => {
	if (typeof input !== 'string') return input;
	return input.trim().replace(/[<>]/g, '');
};

// ============= ইউজারের প্রোফাইল দেখার ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ কারো প্রোফাইল দেখতে চায়
//when user wants to see anoter user's profile 
const getUserProfile = async (req, res) => {
	// URL থেকে ইউজারনেম অথবা আইডি নিচ্ছি
	const { query } = req.params;

	try {
		// Sanitize input
		const sanitizedQuery = sanitizeInput(query);
		
		if (!sanitizedQuery) {
			return res.status(400).json({ error: "Invalid query parameter" });
		}

		let user;

		// যদি query টা একটা valid আইডি হয় (মঙ্গোডিবির আইডি ফরম্যাটে)
		if (mongoose.Types.ObjectId.isValid(sanitizedQuery)) {
			// তাহলে আইডি দিয়ে ইউজার খুঁজি
			// select("-password") মানে পাসওয়ার্ড দেখাবো না
			// select("-updatedAt") মানে আপডেটের সময় দেখাবো না
			user = await User.findOne({ _id: sanitizedQuery }).select("-password").select("-updatedAt");
		} else {
			// না হলে ইউজারনেম দিয়ে ইউজার খুঁজি
			user = await User.findOne({ username: sanitizedQuery }).select("-password").select("-updatedAt");
		}

		// যদি ইউজার না পাওয়া যায়
		if (!user) return res.status(404).json({ error: "User not found" });

		// ইউজারের তথ্য দেখাই
		res.status(200).json(user);
	} catch (err) {
		// কোনো সমস্যা হলে error দেখাই
		res.status(500).json({ error: "Internal server error" });
		console.error("Error in getUserProfile:", err.message);
	}
};

// ============= সাইনআপ (নতুন ইউজার তৈরি) ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ নতুন অ্যাকাউন্ট তৈরি করে
const signupUser = async (req, res) => {
	try {
		// ইউজার যা দিয়েছে সেগুলো নিচ্ছি
		let { name, email, username, password } = req.body;
		
		// Sanitize inputs
		name = sanitizeInput(name);
		email = sanitizeInput(email);
		username = sanitizeInput(username);
		
		// Validate required fields
		if (!name || !email || !username || !password) {
			return res.status(400).json({ error: "All fields are required" });
		}
		
		// Validate email format
		if (!validateEmail(email)) {
			return res.status(400).json({ error: "Invalid email format" });
		}
		
		// Validate username format
		if (!validateUsername(username)) {
			return res.status(400).json({ error: "Username must be 3-20 characters and contain only letters, numbers, and underscores" });
		}
		
		// Validate password strength
		if (!validatePassword(password)) {
			return res.status(400).json({ error: "Password must be at least 6 characters long" });
		}
		
		// দেখি এই ইমেইল বা ইউজারনেম দিয়ে কেউ আগে থেকে আছে কিনা
		const user = await User.findOne({ $or: [{ email }, { username }] });

		// যদি আগে থেকেই থাকে
		if (user) {
			return res.status(400).json({ error: "User already exists" });
		}
		
		// পাসওয়ার্ড এনক্রিপ্ট করার জন্য লবণ তৈরি করি
		const salt = await bcrypt.genSalt(10);
		// পাসওয়ার্ড এনক্রিপ্ট করি
		const hashedPassword = await bcrypt.hash(password, salt);

		// নতুন ইউজার তৈরি করি
		// create new user
		const newUser = new User({
			name,
			email,
			username,
			password: hashedPassword, // এনক্রিপ্ট করা পাসওয়ার্ড রাখি
		});
		// ডাটাবেজে সেভ করি
		await newUser.save();

		// যদি ইউজার সফলভাবে তৈরি হয়
		if (newUser) {
			// টোকেন তৈরি করি এবং কুকিতে সেট করি (লগইন করিয়ে দেই)
			generateTokenAndSetCookie(newUser._id, res);

			// ইউজারের তথ্য দেখাই (পাসওয়ার্ড ছাড়া)
			res.status(201).json({
				_id: newUser._id,
				name: newUser.name,
				email: newUser.email,
				username: newUser.username,
				bio: newUser.bio,
				profilePic: newUser.profilePic,
			});
		} else {
			// যদি ডাটা ঠিক না থাকে
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
		console.error("Error in signupUser:", err.message);
	}
};

// ============= লগইন ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ লগইন করে
//login user
const loginUser = async (req, res) => {
	try {
		// ইউজারনেম এবং পাসওয়ার্ড নিচ্ছি
		let { username, password } = req.body;
		
		// Sanitize inputs
		username = sanitizeInput(username);
		
		// Validate required fields
		if (!username || !password) {
			return res.status(400).json({ error: "Username and password are required" });
		}
		
		// ইউজারনেম দিয়ে ইউজার খুঁজি
		const user = await User.findOne({ username });
		// পাসওয়ার্ড মিলছে কিনা চেক করি
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		// যদি ইউজার না পাওয়া যায় বা পাসওয়ার্ড ভুল হয়
		if (!user || !isPasswordCorrect) return res.status(400).json({ error: "Invalid username or password" });

		// যদি অ্যাকাউন্ট ফ্রোজেন (বন্ধ) থাকে
		if (user.isFrozen) {
			// তাহলে আনফ্রোজেন করি (আবার চালু করি)
			user.isFrozen = false;
			await user.save();
		}

		// টোকেন তৈরি করি এবং কুকিতে সেট করি
		generateTokenAndSetCookie(user._id, res);

		// ইউজারের তথ্য দেখাই (পাসওয়ার্ড ছাড়া)
		res.status(200).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			username: user.username,
			bio: user.bio,
			profilePic: user.profilePic,
		});
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
		console.error("Error in loginUser:", error.message);
	}
};

// ============= লগআউট ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ লগআউট করে
//logout user
const logoutUser = (req, res) => {
	try {
		// কুকি খালি করে দেই (টোকেন মুছে ফেলি)
		res.cookie("jwt", "", { maxAge: 1 });
		res.status(200).json({ message: "User logged out successfully" });
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
		console.error("Error in logoutUser:", err.message);
	}
};

// ============= ফলো/আনফলো ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ কাউকে ফলো করে বা ফলো করা বন্ধ করে
const followUnFollowUser = async (req, res) => {
	try {
		// URL থেকে যাকে ফলো করবে তার আইডি
		const { id } = req.params;
		
		// Validate ID format
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: "Invalid user ID" });
		}
		
		// যাকে ফলো করবে সেই ইউজার
		const userToModify = await User.findById(id);
		// বর্তমান ইউজার (যে ফলো করছে)
		const currentUser = await User.findById(req.user._id);

		// কেউ নিজেকে ফলো করতে পারে 
		if (id === req.user._id.toString())
			return res.status(400).json({ error: "You cannot follow/unfollow yourself" });

		// যদি ইউজার না পাওয়া যায়
		if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

		// দেখি বর্তমান ইউজার আগে থেকে ওকে ফলো করে কিনা
		const isFollowing = currentUser.following.includes(id);

		// যদি আগে থেকে ফলো করে থাকে
		if (isFollowing) {
			// তাহলে আনফলো করবো
			// যাকে ফলো করেছিল তার ফollowers লিস্ট থেকে বর্তমান ইউজারকে বাদ দেই
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			// বর্তমান ইউজারের following লিস্ট থেকে ওকে বাদ দেই
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
			res.status(200).json({ message: "User unfollowed successfully" });
		} else {
			// যদি ফলো না করে থাকে, তাহলে ফলো করবো
			// যাকে ফলো করবে তার followers লিস্টে বর্তমান ইউজারকে যোগ করি
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
			// বর্তমান ইউজারের following লিস্টে ওকে যোগ করি
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
			res.status(200).json({ message: "User followed successfully" });
		}
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
		console.error("Error in followUnFollowUser:", err.message);
	}
};

// ============= ইউজার আপডেট ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ নিজের প্রোফাইল আপডেট করে
const updateUser = async (req, res) => {
	// ইউজার যা আপডেট করতে চায় সেগুলো নিচ্ছি
	let { name, email, username, password, bio } = req.body;
	let { profilePic } = req.body;

	const userId = req.user._id;
	try {
		let user = await User.findById(userId);
		// যদি ইউজার না পাওয়া যায়
		if (!user) return res.status(400).json({ error: "User not found" });

		// কেউ অন্য কারো প্রোফাইল আপডেট করতে পারবে না
		if (req.params.id !== userId.toString())
			return res.status(400).json({ error: "You cannot update other user's profile" });

		// Sanitize inputs
		if (name) name = sanitizeInput(name);
		if (email) email = sanitizeInput(email);
		if (username) username = sanitizeInput(username);
		if (bio) bio = sanitizeInput(bio);
		
		// Validate email if provided
		if (email && !validateEmail(email)) {
			return res.status(400).json({ error: "Invalid email format" });
		}
		
		// Validate username if provided
		if (username && !validateUsername(username)) {
			return res.status(400).json({ error: "Username must be 3-20 characters and contain only letters, numbers, and underscores" });
		}
		
		// Validate password if provided
		if (password && !validatePassword(password)) {
			return res.status(400).json({ error: "Password must be at least 6 characters long" });
		}

		// যদি নতুন পাসওয়ার্ড দেয়
		if (password) {
			// নতুন পাসওয়ার্ড এনক্রিপ্ট করি
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			user.password = hashedPassword;
		}

		// যদি নতুন প্রোফাইল ছবি দেয়
		if (profilePic) {
			// আগের প্রোফাইল ছবি থাকলে ক্লাউড থেকে ডিলিট করি
			if (user.profilePic) {
				await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
			}

			// নতুন ছবি ক্লাউডে আপলোড করি
			const uploadedResponse = await cloudinary.uploader.upload(profilePic);
			profilePic = uploadedResponse.secure_url;
		}

		// নতুন তথ্য দিয়ে আপডেট করি (যা দেয়নি সেটা পুরনো থাকবে)
		user.name = name || user.name;
		user.email = email || user.email;
		user.username = username || user.username;
		user.profilePic = profilePic || user.profilePic;
		user.bio = bio || user.bio;

		// আপডেট করা ইউজার সেভ করি
		user = await user.save();

		// ============= গুরুত্বপূর্ণ: পুরনো কমেন্ট আপডেট করা =============
		// ইউজার তার ইউজারনেম বা প্রোফাইল ছবি পরিবর্তন করলে
		// তার আগের করা সব কমেন্টেও নতুন নাম ও ছবি দেখাতে হবে
		await Post.updateMany(
			{ "replies.userId": userId }, // যেসব পোস্টে এই ইউজারের কমেন্ট আছে
			{
				$set: {
					"replies.$[reply].username": user.username,
					"replies.$[reply].userProfilePic": user.profilePic,
				},
			},
			{ arrayFilters: [{ "reply.userId": userId }] } // শুধু এই ইউজারের কমেন্টগুলো আপডেট করো
		);

		// পাসওয়ার্ড রেসপন্সে দেখাবো না
		user.password = null;

		// আপডেট করা ইউজারের তথ্য দেখাই
		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
		console.error("Error in updateUser:", err.message);
	}
};

// ============= সাজেস্টেড ইউজার দেখানোর ফাংশন =============
// এই ফাংশন কাজ করে যখন কাউকে "আপনি যাদের জানেন না" এরকম ইউজার সাজেস্ট করতে হয়
const getSuggestedUsers = async (req, res) => {
	try {
		// বর্তমান ইউজারকে বাদ দিতে হবে
		const userId = req.user._id;

		// বর্তমান ইউজার যাদের ফলো করে সেটা বের করি
		const usersFollowedByYou = await User.findById(userId).select("following");

		// ডাটাবেজ থেকে র‍্যান্ডম ১০ জন ইউজার আনবো
		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId }, // বর্তমান ইউজার নিজেকে বাদ দাও
				},
			},
			{
				$sample: { size: 10 }, // র‍্যান্ডম ১০ জন আনো
			},
		]);
		
		// যাদেরকে ইতিমধ্যে ফলো করি তাদের বাদ দাও
		const filteredUsers = users.filter((user) => !usersFollowedByYou.following.includes(user._id));
		// প্রথম ৪ জন সাজেস্ট করো
		const suggestedUsers = filteredUsers.slice(0, 4);

		// পাসওয়ার্ড দেখাবো না
		suggestedUsers.forEach((user) => (user.password = null));

		// সাজেস্টেড ইউজার দেখাই
		res.status(200).json(suggestedUsers);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
		console.error("Error in getSuggestedUsers:", error.message);
	}
};

// ============= অ্যাকাউন্ট ফ্রোজেন করার ফাংশন =============
// এই ফাংশন কাজ করে যখন কেউ নিজের অ্যাকাউন্ট বন্ধ (ফ্রোজেন) করতে চায়
const freezeAccount = async (req, res) => {
	try {
		// বর্তমান ইউজার খুঁজি
		const user = await User.findById(req.user._id);
		if (!user) {
			return res.status(400).json({ error: "User not found" });
		}

		// অ্যাকাউন্ট ফ্রোজেন করি
		user.isFrozen = true;
		await user.save();

		// সফল হয়েছে জানাই
		res.status(200).json({ success: true });
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
		console.error("Error in freezeAccount:", error.message);
	}
};

// সব ফাংশন অন্য জায়গায় ব্যবহারের জন্য export করি
export {
	signupUser,
	loginUser,
	logoutUser,
	followUnFollowUser,
	updateUser,
	getUserProfile,
	getSuggestedUsers,
	freezeAccount,
};
