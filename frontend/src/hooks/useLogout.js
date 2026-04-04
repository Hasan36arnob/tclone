import userAtom from "../atoms/userAtom";
import { useSetRecoilState } from "recoil";
import useShowToast from "./useShowToast";

// এই কাস্টম হুক ব্যবহারকারী লগআউট করার জন্য
const useLogout = () => {
	const setUser = useSetRecoilState(userAtom); // ইউজার স্টেট আপডেট করার ফাংশন (রিকয়েল থেকে)
	const showToast = useShowToast(); // নোটিফিকেশন দেখানোর জন্য টোস্ট হুক

	// লগআউট ফাংশন - এটা কল করলে ইউজার লগআউট হবে
	const logout = async () => {
		try {
			// সার্ভারে লগআউট রিকোয়েস্ট পাঠানো হচ্ছে
			const res = await fetch("/api/users/logout", {
				method: "POST", // POST মেথড ব্যবহার করে লগআউট
				headers: {
					"Content-Type": "application/json",
				},
			});
			const data = await res.json(); // সার্ভার থেকে রেসপন্স JSON আকারে নেওয়া হচ্ছে

			// যদি সার্ভার থেকে error আসে
			if (data.error) {
				showToast("Error", data.error, "error"); // error টোস্ট দেখানো হবে
				return; // ফাংশন থেকে বের হয়ে যাবে
			}

			// লোকাল স্টোরেজ থেকে ইউজার ডাটা মুছে ফেলা হচ্ছে
			localStorage.removeItem("user-threads");
			
			// রিকয়েল স্টেট থেকে ইউজার ডাটা null সেট করে দেওয়া হচ্ছে
			setUser(null);
			
			// এখানে সফল লগআউটের পর কিছু করলে করতে পারেন (যেমন: পেজ রিডাইরেক্ট)
		} catch (error) {
			// নেটওয়ার্ক বা অন্য কোনো error হলে টোস্ট দেখানো হচ্ছে
			showToast("Error", error, "error");
		}
	};

	return logout; // লগআউট ফাংশন রিটার্ন করা হচ্ছে, যাতে যেখানে ইচ্ছা কল করা যায়
};

export default useLogout;