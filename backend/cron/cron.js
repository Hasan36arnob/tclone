// ক্রন প্যাকেজ আনা হচ্ছে (নির্দিষ্ট সময় পর পর কাজ করার জন্য)
import cron from "cron";
// https প্যাকেজ আনা হচ্ছে (ওয়েবসাইটে রিকোয়েস্ট পাঠানোর জন্য)
import https from "https";

// যে ওয়েবসাইটে রিকোয়েস্ট পাঠাবো সেটার ঠিকানা
const URL = "https://threads-clone-9if3.onrender.com";

// একটা শিডিউলড কাজ তৈরি করি
// "*/14 * * * *" মানে: প্রতি ১৪ মিনিট পর পর এই কাজটা করো
const job = new cron.CronJob("*/14 * * * *", function () {
	// HTTPS এর মাধ্যমে GET রিকোয়েস্ট পাঠাই
	https
		.get(URL, (res) => {
			// যদি রেসপন্স ঠিকঠাক আসে (স্ট্যাটাস ২০০ মানে সফল)
			if (res.statusCode === 200) {
				console.log("GET request sent successfully"); // সফল হলে এই মেসেজ দেখাও
			} else {
				// যদি সমস্যা হয়
				console.log("GET request failed", res.statusCode); // কোন সমস্যা হয়েছে সেটা দেখাও
			}
		})
		.on("error", (e) => {
			// যদি এরর হয় (ইন্টারনেট না থাকা, সার্ভার ডাউন ইত্যাদি)
			console.error("Error while sending request", e);
		});
});

// এই জবটাকে অন্য জায়গায় ব্যবহারের জন্য export করি
export default job;