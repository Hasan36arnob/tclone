import path from "path";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import { app, server } from "./socket/socket.js";
import job from "./cron/cron.js";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
	console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
	process.exit(1);
}

connectDB().catch((err) => {
	console.error("MongoDB connection failed. API requests will error until it's fixed.");
	console.error(err?.message || err);
});
job.start();

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Security middleware
app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			scriptSrc: ["'self'"],
			imgSrc: ["'self'", "data:", "https:"],
		},
	},
}));

// CORS configuration
const corsOptions = {
	origin: process.env.NODE_ENV === "production" 
		? process.env.CLIENT_URL || "http://localhost:3000"
		: ["http://localhost:3000", "http://localhost:5173"],
	credentials: true,
	optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: process.env.NODE_ENV === "production" ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
	message: "Too many requests from this IP, please try again after 15 minutes",
	standardHeaders: true,
	legacyHeaders: false,
});
app.use("/api/", limiter);

// Body parser with size limits
app.use(express.json({ limit: "10mb" })); // Reduced from 50mb for security
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
	res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// http://localhost:5000 => backend,frontend

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	// react app
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

// 404 handler for API routes
app.use("/api/*", (req, res) => {
	res.status(404).json({ error: "API route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
	console.error("Unhandled error:", err);
	
	const statusCode = err.statusCode || 500;
	const message = process.env.NODE_ENV === "production" 
		? "Internal server error" 
		: err.message || "Something went wrong";
	
	res.status(statusCode).json({ 
		error: message,
		...(process.env.NODE_ENV !== "production" && { stack: err.stack })
	});
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
	console.log(`\n${signal} received. Starting graceful shutdown...`);
	
	server.close(() => {
		console.log("HTTP server closed.");
		
		// Close database connection
		import("mongoose").then((mongoose) => {
			mongoose.connection.close(false, () => {
				console.log("MongoDB connection closed.");
				process.exit(0);
			});
		});
	});
	
	// Force close after 10 seconds
	setTimeout(() => {
		console.error("Could not close connections in time, forcefully shutting down");
		process.exit(1);
	}, 10000);
};

// Listen for shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
	console.error("Unhandled Rejection:", err);
	gracefulShutdown("unhandledRejection");
});

server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));
