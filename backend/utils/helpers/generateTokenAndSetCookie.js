import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, res) => {
	// Validate JWT_SECRET exists
	if (!process.env.JWT_SECRET) {
		throw new Error("JWT_SECRET environment variable is not set");
	}

	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "15d",
	});

	res.cookie("jwt", token, {
		httpOnly: true, // more secure - prevents XSS attacks
		maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
		sameSite: "strict", // CSRF protection
		secure: process.env.NODE_ENV === "production", // HTTPS only in production
		path: "/", // Cookie path
	});

	return token;
};

export default generateTokenAndSetCookie;
