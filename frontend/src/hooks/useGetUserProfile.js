import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useShowToast from "./useShowToast";

// এই কাস্টম হুক ইউজারনেম দিয়ে ইউজারের প্রোফাইল ডাটা আনতে ব্যবহার হয়
const useGetUserProfile = () => {
	const [user, setUser] = useState(null); // ইউজারের ডাটা স্টোর করার জন্য স্টেট
	const [loading, setLoading] = useState(true); // লোডিং ইন্ডিকেটরের জন্য স্টেট (true মানে ডাটা আসেনি)
	const { username } = useParams(); // URL থেকে ইউজারনেম প্যারামিটার নেওয়া হচ্ছে (যেমন: /profile/johndoe)
	const showToast = useShowToast(); // নোটিফিকেশন দেখানোর জন্য টোস্ট হুক

	// useEffect রান হবে যখন কম্পোনেন্ট প্রথমবার লোড হবে অথবা username পরিবর্তন হবে
	useEffect(() => {
		const getUser = async () => {
			try {
				// সার্ভার থেকে ওই ইউজারনেমের প্রোফাইল ডাটা fetch করা হচ্ছে
				const res = await fetch(`/api/users/profile/${username}`);
				const data = await res.json(); // রেসপন্সকে JSON এ কনভার্ট করা
				
				// যদি সার্ভার থেকে error মেসেজ আসে
				if (data.error) {
					showToast("Error", data.error, "error");
					return; // ফাংশন থেকে বের হয়ে যাবে
				}
				
				// যদি ইউজারের একাউন্ট ফ্রোজেন (বন্ধ) করা থাকে
				if (data.isFrozen) {
					setUser(null); // ইউজার স্টেট null সেট করা
					return;
				}
				
				// সব ঠিক থাকলে ইউজার ডাটা স্টেটে সেট করা
				setUser(data);
			} catch (error) {
				// নেটওয়ার্ক বা অন্য কোনো error হলে টোস্ট দেখানো
				showToast("Error", error.message, "error");
			} finally {
				// সবশেষে (সফল বা error যাই হোক) লোডিং false করে দেওয়া
				setLoading(false);
			}
		};
		
		getUser(); // ফাংশন কল করা হচ্ছে
	}, [username, showToast]); // username বা showToast পরিবর্তন হলে useEffect আবার রান হবে

	// লোডিং স্টেট এবং ইউজার ডাটা রিটার্ন করা হচ্ছে
	return { loading, user };
};

export default useGetUserProfile;