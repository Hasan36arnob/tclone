import { useToast } from "@chakra-ui/toast";
import { useCallback } from "react";

// একটি কাস্টম হুক যা নোটিফিকেশন (টোস্ট মেসেজ) দেখানোর জন্য ব্যবহৃত হয়
const useShowToast = () => {
	const toast = useToast(); // Chakra UI এর টোস্ট ফাংশন

	// showToast ফাংশনটি মেমোরাইজ করে রাখা হচ্ছে (পুনরায় রেন্ডার কমাতে)
	const showToast = useCallback(
		(title, description, status) => {
			// description যেকোনো টাইপের হতে পারে, তাই সেটাকে স্ট্রিং-এ কনভার্ট করা হচ্ছে
			const safeDescription =
				description instanceof Error
					? description.message // যদি Error হয়, তাহলে এর মেসেজ নিবো
					: typeof description === "string"
						? description // যদি স্ট্রিং হয়, তাহলে সেটাই থাকবে
						: description == null
							? "" // যদি null বা undefined হয়, তাহলে খালি স্ট্রিং
							: typeof description === "object"
								? JSON.stringify(description) // যদি অবজেক্ট হয়, তাহলে JSON স্ট্রিং বানাবো
								: String(description); // বাকি সব ক্ষেত্রে সাধারণ স্ট্রিং বানাবো

			// টোস্ট দেখানোর জন্য Chakra UI এর টোস্ট কল করা হচ্ছে
			toast({
				title, // টোস্টের শিরোনাম (যেমন: "সফল", "ত্রুটি")
				description: safeDescription, // টোস্টের বিস্তারিত বিবরণ
				status, // টোস্টের ধরণ (যেমন: "success", "error", "info", "warning")
				duration: 3000, // ৩ সেকেন্ড পর টোস্ট নিজে নিজে বন্ধ হবে
				isClosable: true, // ব্যবহারকারী এক্স বাটনে ক্লিক করে বন্ধ করতে পারবে
			});
		},
		[toast] // toast পরিবর্তন হলেই শুধু এই ফাংশন পুনরায় তৈরি হবে
	);

	return showToast; // ফাংশনটি বাইরে ব্যবহারের জন্য রিটার্ন করা হচ্ছে
};

export default useShowToast;