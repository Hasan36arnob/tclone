import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

//dwdwd
const protectRoute = async (req, res, next) => {
	try {
		const token = req.cookies.jwt;

		if (!token) return res.status(401).json({ error: "Unauthorized" });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			return res.status(401).json({ error: "User not found" });
		}

		req.user = user;

		next();
	} catch (err) {
		res.status(401).json({ error: "Unauthorized: Invalid token" });
		console.log("Error in protectRoute: ", err.message);
	}
};

export default protectRoute;
