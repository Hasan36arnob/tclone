// jsonwebtoken লাইব্রেরি থেকে jwt ইমপোর্ট করা হচ্ছে
import jwt from "jsonwebtoken";

// একটি ফাংশন যা ইউজার আইডি এবং রেসপন্স অবজেক্ট নিয়ে কাজ করে
const generateTokenAndSetCookie = (userId, res) => {
    // চেক করা হচ্ছে যে JWT_SECRET এনভায়রনমেন্ট ভেরিয়েবল সেট করা আছে কিনা
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is not set"); // যদি না থাকে তাহলে একটি এরর থ্রো করা হবে
    }

    // একটি JWT টোকেন জেনারেট করা হচ্ছে ইউজার আইডি এবং JWT_SECRET ব্যবহার করে
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "15d", // টোকেনের মেয়াদ ১৫ দিন
    });

    // সেট করা হচ্ছে একটি কুকি যেখানে জেনারেট করা টোকেন থাকবে
    res.cookie("jwt", token, {
        httpOnly: true, // আরো সিকিউর - XSS আক্রমণ প্রতিরোধ করে
        maxAge: 15 * 24 * 60 * 60 * 1000, // কুকির মেয়াদ ১৫ দিন (মিলিসেকেন্ডে)
        sameSite: "strict", // CSRF আক্রমণ প্রতিরোধ করে
        secure: process.env.NODE_ENV === "production", // শুধুমাত্র প্রোডাকশন এনভায়রনমেন্টে HTTPS ব্যবহার করে
        path: "/", // কুকির পথ
    });

    // জেনারেট করা টোকেন রিটার্ন করা হচ্ছে
    return token;
};

// ফাংশনটি এক্সপোর্ট করা হচ্ছে যাতে অন্য ফাইল থেকে ইমপোর্ট করে ব্যবহার করা যায়
export default generateTokenAndSetCookie;
