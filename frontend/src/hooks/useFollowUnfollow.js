import { useState } from "react"; // React থেকে useState হুক ইমপোর্ট করা হয়েছে
import useShowToast from "./useShowToast"; // কাস্টম হুক useShowToast ইমপোর্ট করা হয়েছে
import userAtom from "../atoms/userAtom"; // Recoil থেকে userAtom ইমপোর্ট করা হয়েছে
import { useRecoilValue } from "recoil"; // Recoil থেকে useRecoilValue হুক ইমপোর্ট করা হয়েছে

const useFollowUnfollow = (user) => {
	// বর্তমান লগইন করা ইউজারকে পাওয়ার জন্য Recoil থেকে userAtom ব্যবহার করা হচ্ছে
	const currentUser = useRecoilValue(userAtom);

	// ইউজারটি ফলো করা আছে কিনা তা ট্র্যাক করার জন্য স্টেট
	const [following, setFollowing] = useState(user.followers.includes(currentUser?._id));

	// ফলো/আনফলো অপারেশন চলাকালীন লোডিং স্টেট
	const [updating, setUpdating] = useState(false);

	// টোস্ট মেসেজ দেখানোর জন্য কাস্টম হুক
	const showToast = useShowToast();

	// ফলো/আনফলো অপারেশন হ্যান্ডেল করার ফাংশন
	const handleFollowUnfollow = async () => {
		// যদি কোনো ইউজার লগইন না থাকে, তাহলে এরর মেসেজ দেখাবে
		if (!currentUser) {
			showToast("Error", "Please login to follow", "error");
			return;
		}

		// যদি ইতিমধ্যে কোনো আপডেট চলমান থাকে, তাহলে ফাংশন থেকে বেরিয়ে যাবে
		if (updating) return;

		// আপডেট শুরু হচ্ছে, লোডিং স্টেট সেট করা হচ্ছে
		setUpdating(true);

		try {
			// API কল করে ফলো/আনফলো অপারেশন সম্পন্ন করা হচ্ছে
			const res = await fetch(`/api/users/follow/${user._id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json", // JSON ফরম্যাটে ডেটা পাঠানো হচ্ছে
				},
			});

			// রেসপন্স থেকে ডেটা পার্স করা হচ্ছে
			const data = await res.json();

			// যদি API থেকে এরর আসে, তাহলে টোস্ট মেসেজ দেখাবে
			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}

			// যদি ইতিমধ্যে ফলো করা থাকে, তাহলে আনফলো করা হবে
			if (following) {
				showToast("Success", `Unfollowed ${user.name}`, "success");
				user.followers.pop(); // ফলোয়ার লিস্ট থেকে বর্তমান ইউজারকে রিমুভ করা হচ্ছে (সিমুলেশন)
			}
			// যদি ফলো না করা থাকে, তাহলে ফলো করা হবে
			else {
				showToast("Success", `Followed ${user.name}`, "success");
				user.followers.push(currentUser?._id); // ফলোয়ার লিস্টে বর্তমান ইউজারকে যোগ করা হচ্ছে (সিমুলেশন)
			}

			// ফলো/আনফলো স্টেট আপডেট করা হচ্ছে
			setFollowing(!following);

			// ডিবাগিং এর জন্য ডেটা কনসোলে প্রিন্ট করা হচ্ছে
			console.log(data);
		}
		// যদি কোনো এরর হয়, তাহলে টোস্ট মেসেজ দেখাবে
		catch (error) {
			showToast("Error", error, "error");
		}
		// সবশেষে আপডেটিং স্টেট ফলস করা হচ্ছে
		finally {
			setUpdating(false);
		}
	};

	// ফাংশন এবং স্টেট রিটার্ন করা হচ্ছে
	return { handleFollowUnfollow, updating, following };
};

// হুক এক্সপোর্ট করা হচ্ছে
export default useFollowUnfollow;