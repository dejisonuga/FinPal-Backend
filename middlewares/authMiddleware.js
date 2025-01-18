import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { generateToken } from "../controllers/tokenController.js";

export const authenticate = async (req, res, next) => {
	try {
		// Check if the Authorization header exists
		const token = req.header("Authorization")?.replace("Bearer ", "");
		// If token is not provided
		if (!token) {
			return res.status(401).send({ error: "Authentication token required" });
		}

		// Verify the token and decode it
		const decoded = (token) => {
			return jwt.verify(token, generateToken);
		};

		// Find the user based on the decoded user ID
		const user = await User.find(decoded._id);
		if (!user) {
			return res.status(401).send({ error: "User not found" });
		}

		// Attach user to request object for further use
		req.user = user;

		// Proceed to the next middleware or route handler
		next();
	} catch (error) {
		// Handle any other errors
		console.error(error);
		res.status(401).send({ error: "Please authenticate" });
	}
};

export const protect = async (req, res, next) => {
	try {
		let protectToken;
		/**
		 * in headers / Bearer (authorization), add the token after login or registration
		 * e.g. Bearer evyrnsdfu349fsdn349gdnsf93ew ...
		 */
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			protectToken = req.headers.authorization.split(" ")[1];
		}

		if (!protectToken) {
			return res.status(401).json({
				status: "error",
				message: "Not authorized to access this route",
			});
		}

		try {
			const decoded = jwt.verify(protectToken, generateToken); // Decode and pull out id that was added
			const user = await User.findByPk(decoded.id); // get the id and pull record from db

			if (!user) {
				return res.status(401).json({
					status: "error",
					message: "User no longer exists",
				});
			}

			if (!user.isActive) {
				return res.status(401).json({
					status: "error",
					message: "User account is deactivated",
				});
			}

			req.user = user;
			next();
		} catch (error) {
			return res.status(401).json({
				status: "error",
				message: "Token is invalid or expired",
				data: error,
			});
		}
	} catch (error) {
		next(error);
	}
};

// export const authorize = (...roles) => {
// 	return (req, res, next) => {
// 		if (!roles.includes(req.user.role)) {
// 			return res.status(403).json({
// 				status: "error",
// 				message: `Role ${req.user.role} is not authorized to access this route`,
// 			});
// 		}
// 		next();
// 	};
// };
