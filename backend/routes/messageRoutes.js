// এক্সপ্রেস আনা হচ্ছে (রাস্তা তৈরি করার জন্য)
import express from "express";
// প্রোটেক্ট রুট আনা হচ্ছে (সিকিউরিটি গার্ড)
import protectRoute from "../middlewares/protectRoute.js";
// মেসেজ কন্ট্রোলার থেকে ফাংশনগুলো আনা হচ্ছে
import { getMessages, sendMessage, getConversations } from "../controllers/messageController.js";

// রাউটার তৈরি করি (রাস্তাগুলোর ম্যাপ)
const router = express.Router();

// ============= ১. সব কথোপকথন দেখা =============
// রাস্তা: /api/messages/conversations
// কাজ: লগইন করা ইউজারের সব কথোপকথন দেখাবে
router.get("/conversations", protectRoute, getConversations);

// ============= ২. নির্দিষ্ট কারো সাথে সব মেসেজ দেখা =============
// রাস্তা: /api/messages/:otherUserId
// কাজ: অন্য ইউজারের সাথে হওয়া সব মেসেজ দেখাবে
router.get("/:otherUserId", protectRoute, getMessages);

// ============= ৩. নতুন মেসেজ পাঠানো =============
// রাস্তা: /api/messages/
// কাজ: নতুন মেসেজ পাঠাবে
router.post("/", protectRoute, sendMessage);

// রাউটারটাকে অন্য জায়গায় ব্যবহারের জন্য পাঠিয়ে দিচ্ছি
export default router;