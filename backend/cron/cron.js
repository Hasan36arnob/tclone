// ক্রন প্যাকেজ আনা হচ্ছে (নির্দিষ্ট সময় পর পর কাজ করার জন্য)
import cron from "cron";
// https প্যাকেজ আনা হচ্ছে (ওয়েবসাইটে রিকোয়েস্ট পাঠানোর জন্য)
import https from "https";

// যে ওয়েবসাইটে রিকোয়েস্ট পাঠাবো সেটার ঠিকানা
// Use environment variable or default to localhost
const URL = process.env.PING_URL || "http://localhost:5000/api/health";

let job;

// Only run cron job in production
if (process.env.NODE_ENV === "production") {
	// একটা শিডিউলড কাজ তৈরি করি
	// "*/14 * * * *" মানে: প্রতি ১৪ মিনিট পর পর এই কাজটা করো
	job = new cron.CronJob("*/14 * * * *", function () {
		// HTTPS এর মাধ্যমে GET রিকোয়েস্ট পাঠাই
		https
			.get(URL, (res) => {
				// যদি রেসপন্স ঠিকঠাক আসে (স্ট্যাটাস ২০০ মানে সফল)
				if (res.statusCode === 200) {
					console.log("Ping successful"); // সফল হলে এই মেসেজ দেখাও
				} else {
					// যদি সমস্যা হয়
					console.warn("Ping failed with status:", res.statusCode); // কোন সমস্যা হয়েছে সেটা দেখাও
				}
			})
			.on("error", (e) => {
				// যদি এরর হয় (ইন্টারনেট না থাকা, সার্ভার ডাউন ইত্যাদি)
				console.error("Ping error:", e.message);
			});
	});
} else {
	// In development, export a dummy job that does nothing
	job = {
		start: () => console.log("Cron job disabled in development"),
		stop: () => {},
	};
}

// এই জবটাকে অন্য জায়গায় ব্যবহারের জন্য export করি
export default job;
