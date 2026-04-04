import { useState } from "react";
import useShowToast from "./useShowToast";

// এই কাস্টম হুক ব্যবহারকারীর নির্বাচিত ছবির প্রিভিউ দেখানোর জন্য
const usePreviewImg = () => {
	const [imgUrl, setImgUrl] = useState(null); // ছবির URL সংরক্ষণের জন্য স্টেট
	const showToast = useShowToast(); // নোটিফিকেশন দেখানোর জন্য টোস্ট হুক

	// যখন ব্যবহারকারী ইনপুট ফিল্ড থেকে ছবি সিলেক্ট করে, তখন এই ফাংশন কল হয়
	const handleImageChange = (e) => {
		const file = e.target.files[0]; // প্রথম সিলেক্ট করা ফাইলটি নেওয়া হচ্ছে

		// চেক করা হচ্ছে ফাইল আছে কিনা এবং সেটা ইমেজ টাইপের কিনা
		if (file && file.type.startsWith("image/")) {
			const reader = new FileReader(); // ফাইল পড়ার জন্য FileReader অবজেক্ট তৈরি

			// ফাইল পড়া শেষ হলে এই ইভেন্ট ট্রিগার হয়
			reader.onloadend = () => {
				setImgUrl(reader.result); // রিডার থেকে পাওয়া ডাটা URL স্টেটে সেট করা হচ্ছে
			};

			reader.readAsDataURL(file); // ফাইলটাকে Data URL হিসেবে পড়া হচ্ছে
		} else {
			// যদি ফাইল ইমেজ না হয়, তাহলে error মেসেজ দেখানো হচ্ছে
			showToast("Invalid file type", " দয়া করে একটি ইমেজ ফাইল সিলেক্ট করুন", "error");
			setImgUrl(null); // আগের imgUrl রিসেট করে দেওয়া হচ্ছে
		}
	};

	// প্রয়োজনীয় ফাংশন এবং স্টেটগুলো রিটার্ন করা হচ্ছে
	return { handleImageChange, imgUrl, setImgUrl };
};

export default usePreviewImg;