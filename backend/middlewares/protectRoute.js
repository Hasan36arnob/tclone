// ইউজার মডেল আনা হচ্ছে (ইউজারের তথ্য কোথায় রাখবো)
import User from "../models/userModel.js";
// jwt আনা হচ্ছে (টোকেন ভেরিফাই করার জন্য)
import jwt from "jsonwebtoken";

// ============= প্রোটেক্ট রুট মিডলওয়্যার =============
// এই ফাংশন কাজ করে যখন কেউ লগইন না করে কোনো পেইজ দেখতে চায়
// এটা দরজার সামনের সিকিউরিটি গার্ডের মতো! 🛡️
const protectRoute = async (req, res, next) => {
	try {
		// ব্রাউজারের কুকি থেকে টোকেনটা নিচ্ছি
		// (লগইন করার সময় টোকেনটা কুকিতে সেভ করা হয়েছিল)
		const token = req.cookies.jwt;

		// যদি টোকেন না থাকে (মানে লগইন করা নেই)
		if (!token) {
			// তাহাকে বলে দাও: "তুমি অনুমতি পাবে না, আগে লগইন করো!"
			return res.status(401).json({ error: "Unauthorized" });
		}

		// টোকেন ভেরিফাই করি (চেক করি এটা আসল কিনা, কেউ নকল করেনি তো?)
		// process.env.JWT_SECRET হলো গোপন চাবি (শুধু আমার জানা)
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// টোকেন থেকে ইউজারের আইডি বের করি, আর সেই ইউজারকে ডাটাবেজ থেকে খুঁজি
		// select("-password") মানে পাসওয়ার্ডটা বাদ দিয়ে দাও (সুরক্ষার জন্য)
		const user = await User.findById(decoded.userId).select("-password");

		// যদি ইউজার না পাওয়া যায় (মানে টোকেন ঠিক আছে কিন্তু ইউজার মুছে গেছে?)
		if (!user) {
			return res.status(401).json({ error: "User not found" });
		}

		// সবকিছু ঠিক থাকলে, ইউজারের তথ্য req-এর সাথে জুড়ে দেই
		// যেন পরের ফাংশনগুলো জানতে পারে কে লগইন করছে
		req.user = user;

		// next() মানে: "সব ঠিক আছে, পরের কাজে যাও"
		next();
		
	} catch (err) {
		// যদি টোকেন নকল হয়, মেয়াদ শেষ হয়ে যায়, বা অন্য কোনো সমস্যা হয়
		res.status(401).json({ error: "Unauthorized: Invalid token" });
		console.log("Error in protectRoute: ", err.message);
	}
};

// এই মিডলওয়্যারটা অন্য জায়গায় ব্যবহারের জন্য export করি
export default protectRoute;