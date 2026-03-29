// এক্সপ্রেস আনা হচ্ছে (রাস্তা তৈরি করার জন্য)
import express from "express";
// পোস্ট কন্ট্রোলার থেকে সব ফাংশন আনা হচ্ছে
import {
	createPost,      // নতুন পোস্ট তৈরি
	deletePost,      // পোস্ট মুছে ফেলা
	getPost,         // একটা পোস্ট দেখা
	likeUnlikePost,  // লাইক দেওয়া/তুলে নেওয়া
	replyToPost,     // কমেন্ট করা
	getFeedPosts,    // ফিডের পোস্ট দেখা
	getUserPosts,    // নির্দিষ্ট ইউজারের পোস্ট দেখা
} from "../controllers/postController.js";
// সিকিউরিটি গার্ড আনা হচ্ছে (লগইন চেক করার জন্য)
import protectRoute from "../middlewares/protectRoute.js";
// মুল্টার আনা হচ্ছে (ছবি/ভিডিও আপলোড করার জন্য)
import multer from "multer";

// রাউটার তৈরি করি (রাস্তাগুলোর ম্যাপ)
const router = express.Router();
// আপলোড সেটআপ: মেমরিতে ফাইল রাখবে (ডিস্কে না)
const upload = multer({ storage: multer.memoryStorage() });

// ============= ১. ফিডের পোস্ট দেখা =============
// রাস্তা: /api/posts/feed
// কাজ: যাদের ফলো করো তাদের পোস্ট দেখাবে
router.get("/feed", protectRoute, getFeedPosts);

// ============= ২. একটা নির্দিষ্ট পোস্ট দেখা =============
// রাস্তা: /api/posts/:id
// কাজ: পোস্টের আইডি দিয়ে একটা পোস্ট দেখাবে
// লগইন লাগবে না (সবাই দেখতে পারে)
router.get("/:id", getPost);

// ============= ৩. নির্দিষ্ট ইউজারের সব পোস্ট দেখা =============
// রাস্তা: /api/posts/user/:username
// কাজ: ইউজারনেম দিয়ে ওই ইউজারের সব পোস্ট দেখাবে
router.get("/user/:username", getUserPosts);

// ============= ৪. নতুন পোস্ট তৈরি করা =============
// রাস্তা: /api/posts/create
// কাজ: নতুন পোস্ট করবে (টেক্সট + ছবি/ভিডিও)
// upload.single("media") মানে: "media" নামে একটা ফাইল নেবে
router.post("/create", protectRoute, upload.single("media"), createPost);

// ============= ৫. পোস্ট ডিলিট করা =============
// রাস্তা: /api/posts/:id
// কাজ: পোস্টের আইডি দিয়ে পোস্ট মুছে ফেলবে
router.delete("/:id", protectRoute, deletePost);

// ============= ৬. লাইক দেওয়া/তুলে নেওয়া =============
// রাস্তা: /api/posts/like/:id
// কাজ: পোস্টে লাইক দেবে (আগে থেকে লাইক থাকলে তুলে নেবে)
router.put("/like/:id", protectRoute, likeUnlikePost);

// ============= ৭. কমেন্ট করা =============
// রাস্তা: /api/posts/reply/:id
// কাজ: পোস্টে কমেন্ট (রিপ্লাই) করবে
router.put("/reply/:id", protectRoute, replyToPost);

// রাউটারটাকে অন্য জায়গায় ব্যবহারের জন্য পাঠিয়ে দিচ্ছি
export default router;