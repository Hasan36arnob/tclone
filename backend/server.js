// ============= দরকারি প্যাকেজগুলো আনা হচ্ছে =============
import path from "path";           // ফাইলের পাথ নিয়ে কাজ করার জন্য
import express from "express";     // ওয়েব সার্ভার বানানোর জন্য
import dotenv from "dotenv";       // গোপন তথ্য (পাসওয়ার্ড ইত্যাদি) পড়ার জন্য
import connectDB from "./db/connectDB.js";  // ডাটাবেজ কানেক্ট করার ফাংশন
import cookieParser from "cookie-parser";   // কুকি পড়ার জন্য
import userRoutes from "./routes/userRoutes.js";      // ইউজার রাস্তা
import postRoutes from "./routes/postRoutes.js";      // পোস্ট রাস্তা
import messageRoutes from "./routes/messageRoutes.js"; // মেসেজ রাস্তা
import { v2 as cloudinary } from "cloudinary";        // ছবি আপলোডের জন্য
import { app, server } from "./socket/socket.js";     // সকেট (রিয়েল টাইম) 
import job from "./cron/cron.js";                     // ক্রন জব (কিপ-অ্যালাইভ)
import helmet from "helmet";                           // নিরাপত্তার জন্য (টুপি)
import cors from "cors";                               // অন্য সাইট থেকে অনুমতি
import rateLimit from "express-rate-limit";            // রিকোয়েস্ট লিমিট
import mongoSanitize from "express-mongo-sanitize";   // NoSQL ইনজেকশন ঠেকায়
import hpp from "hpp";                                 // প্যারামিটার পলিউশন ঠেকায়

// ============= গোপন তথ্য লোড করা =============
dotenv.config();  // .env ফাইল থেকে গোপন তথ্য পড়া

// ============= দরকারি গোপন তথ্য আছে কিনা চেক =============
const requiredEnvVars = [
  'MONGO_URI',           // ডাটাবেজের ঠিকানা
  'JWT_SECRET',          // টোকেন সাইন করার গোপন চাবি
  'CLOUDINARY_CLOUD_NAME',  // ক্লাউডিনারি ক্লাউডের নাম
  'CLOUDINARY_API_KEY',     // ক্লাউডিনারি এপিআই কী
  'CLOUDINARY_API_SECRET'   // ক্লাউডিনারি গোপন চাবি
];

// কোন গোপন তথ্য নেই সেগুলো বের করা
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

// যদি কিছু না থাকে
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);  // প্রোগ্রাম বন্ধ করে দাও
}

// ============= ডাটাবেজে কানেক্ট করা =============
connectDB().catch((err) => {
  console.error("MongoDB connection failed. API requests will error until it's fixed.");
  console.error(err?.message || err);
});

// ============= ক্রন জব শুরু করা =============
job.start();  // প্রতি ১৪ মিনিট পর পর ওয়েবসাইটকে জাগিয়ে রাখে

// ============= পোর্ট সেট করা =============
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();  // বর্তমান ফোল্ডারের পাথ

// ============= ক্লাউডিনারি কনফিগার করা =============
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============= নিরাপত্তা মিডলওয়্যার =============
// helmet: ওয়েবসাইটের টুপি (সুরক্ষা বাড়ায়)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],        // শুধু নিজের সাইট থেকে
      styleSrc: ["'self'", "'unsafe-inline'"],  // স্টাইল শুধু নিজের
      scriptSrc: ["'self'"],          // স্ক্রিপ্ট শুধু নিজের
      imgSrc: ["'self'", "data:", "https:"],  // ছবি যে কোন জায়গা থেকে
    },
  },
}));

// ============= CORS সেটআপ (অন্য সাইট থেকে অনুমতি) =============
const corsOptions = {
  // প্রোডাকশনে (লাইভ সাইট) ক্লায়েন্টের ঠিকানা
  origin: process.env.NODE_ENV === "production" 
    ? process.env.CLIENT_URL || "http://localhost:3000"
    : ["http://localhost:3000", "http://localhost:5173"],  // ডেভেলপমেন্টে এই ঠিকানা
  credentials: true,  // কুকি পাঠাতে দেয়
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ============= রেট লিমিটিং (অনেক রিকোয়েস্ট ঠেকায়) =============
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === "production" ? 100 : 1000,  // প্রতি আইপি থেকে সর্বোচ্চ রিকোয়েস্ট
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);  // শুধু /api রাস্তায় লাগানো

// ============= বডি পার্সার (ডাটা পড়ার জন্য) =============
app.use(express.json({ limit: "10mb" }));      // JSON ডাটা পড়ে, সর্বোচ্চ ১০MB
app.use(express.urlencoded({ extended: true, limit: "10mb" }));  // ফর্ম ডাটা পড়ে
app.use(cookieParser());  // কুকি পড়ে

// ============= ডাটা স্যানিটাইজেশন (NoSQL ইনজেকশন ঠেকায়) =============
app.use(mongoSanitize());  // যেমন: $gt, $ne এর মতো অপারেটর সরিয়ে দেয়

// ============= এইচপিপি (প্যারামিটার পলিউশন ঠেকায়) =============
app.use(hpp());  // একই প্যারামিটার বারবার পাঠানো ঠেকায়

// ============= রাস্তা (রাউট) গুলো =============
app.use("/api/users", userRoutes);      // ইউজার সংক্রান্ত রাস্তা
app.use("/api/posts", postRoutes);      // পোস্ট সংক্রান্ত রাস্তা
app.use("/api/messages", messageRoutes); // মেসেজ সংক্রান্ত রাস্তা

// ============= হেলথ চেক (সার্ভার ঠিক আছে কিনা দেখার জন্য) =============
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============= প্রোডাকশনে ফ্রন্টএন্ড সার্ভ করা =============
if (process.env.NODE_ENV === "production") {
  // স্ট্যাটিক ফাইল (HTML, CSS, JS) সার্ভ করা
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  // রিয়েক্ট অ্যাপ: যেকোনো রাস্তায় ফ্রন্টএন্ডের index.html পাঠানো
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// ============= ৪০৪ হ্যান্ডলার (রাস্তা না পাওয়া গেলে) =============
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// ============= গ্লোবাল এরর হ্যান্ডলার (সব এরর ধরে) =============
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" 
    ? "Internal server error"   // প্রোডাকশনে সাধারণ মেসেজ
    : err.message || "Something went wrong";  // ডেভেলপমেন্টে আসল মেসেজ
  
  res.status(statusCode).json({ 
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })  // ডেভেলপমেন্টে স্ট্যাক দেখায়
  });
});

//গ্রেসফুল শাটডাউন (সুন্দরভাবে বন্ধ হওয়া)  
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // সার্ভার বন্ধ করা
  server.close(() => {
    console.log("HTTP server closed.");
    
    // ডাটাবেজ কানেকশন off করা
    import("mongoose").then((mongoose) => {
      mongoose.connection.close(false, () => {
        console.log("MongoDB connection closed.");
        process.exit(0);  // প্রোগ্রাম বন্ধ
      });
    });
  });
  
  // ১০ সেকেন্ড পর জোর করে বন্ধ করে দেওয়া
  //
  setTimeout(() => {
    console.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

// ============= শাটডাউন সিগন্যাল শোনা =============
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));  // সার্ভার বন্ধের সংকেত
process.on("SIGINT", () => gracefulShutdown("SIGINT"));    // Ctrl+C চাপলে

// ============= ধরা না পড়া এরর ধরা =============
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});

// ============= ধরা না পড়া প্রমিজ রিজেকশন ধরা =============
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  gracefulShutdown("unhandledRejection");
});

// ============= সার্ভার চালু করা =============
server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));