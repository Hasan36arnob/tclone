import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI);

		console.log(`MongoDB Connected: ${conn.connection.host}`);
		return conn;
	} catch (error) {
		const message = error?.message || String(error);
		console.error(`MongoDB connection error: ${message}`);

		// Dev-friendly fallback: if Atlas/network blocks you, start an in-memory MongoDB so the app can run.
		if (process.env.NODE_ENV !== "production") {
			try {
				const mongoServer = await MongoMemoryServer.create();
				const uri = mongoServer.getUri();
				const conn = await mongoose.connect(uri);
				console.log(`MongoDB (in-memory) Connected: ${conn.connection.host}`);
				return conn;
			} catch (fallbackError) {
				console.error(`MongoDB in-memory fallback failed: ${fallbackError?.message || fallbackError}`);
			}
		}

		throw error;
	}
};

export default connectDB;
