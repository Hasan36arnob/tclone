// mongoose আনা হচ্ছে (MongoDB এর সাথে কথা বলার জন্য)
import mongoose from "mongoose";
// MongoMemoryServer আনা হচ্ছে (কম্পিউটারের মেমরিতে MongoDB চালানোর জন্য)
import { MongoMemoryServer } from "mongodb-memory-server";

// ডাটাবেস কানেক্ট করার ফাংশন
const connectDB = async () => {
	try {
		// MongoDB এর সাথে কানেক্ট করি (যেখানে আসল ডাটা রাখবো)
		// process.env.MONGO_URI হলো ডাটাবেসের ঠিকানা (যেমন: mongodb+srv://...)
		const conn = await mongoose.connect(process.env.MONGO_URI);
		
		// কানেক্ট হয়ে গেলে কোন হোস্টে কানেক্ট হয়েছে সেটা দেখাই
		console.log(`MongoDB Connected: ${conn.connection.host}`);
		
		// কানেকশনটা রিটার্ন করি (অন্য জায়গায় ব্যবহারের জন্য)
		return conn;
		
	} catch (error) {
		// যদি এরর হয়, তাহলে এরর মেসেজটা বের করি
		const message = error?.message || String(error);
		console.error(`MongoDB connection error: ${message}`);

		// ============= স্মার্ট ফিচার: ব্যাকআপ প্ল্যান =============
		// যদি আসল ডাটাবেসে কানেক্ট না হয় (ইন্টারনেট না থাকা, সার্ভার ডাউন ইত্যাদি)
		// আর যদি আমরা ডেভেলপমেন্ট মোডে থাকি (প্রোডাকশন না হয়)
		if (process.env.NODE_ENV !== "production") {
			try {
				// তাহলে মেমরিতে একটা MongoDB সার্ভার তৈরি করি (টেম্পোরারি)
				const mongoServer = await MongoMemoryServer.create();
				// সেই সার্ভারের ঠিকানা পাই
				const uri = mongoServer.getUri();
				// মেমরির ডাটাবেসে কানেক্ট করি
				const conn = await mongoose.connect(uri);
				// সফল হলে মেসেজ দেখাই
				console.log(`MongoDB (in-memory) Connected: ${conn.connection.host}`);
				// কানেকশনটা রিটার্ন করি
				return conn;
			} catch (fallbackError) {
				// ব্যাকআপ প্ল্যানও কাজ না করলে এরর দেখাই
				console.error(`MongoDB in-memory fallback failed: ${fallbackError?.message || fallbackError}`);
			}
		}

		// সব ব্যর্থ হলে এরর থ্রো করি
		throw error;
	}
};

// ফাংশনটা অন্য জায়গায় ব্যবহারের জন্য export করি
export default connectDB;