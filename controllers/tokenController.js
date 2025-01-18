import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import crypto from "crypto";

dotenv.config();

const data = {
	Userid: User._id,
	fullName: "fullName",
	email: "email",
	iat: Math.floor(Date.now() / 1000),
};

const secretKey = process.env.JWT_SECRET;
const tokenExpiration = process.env.JWT_EXPIRATION;
const algorithm = process.env.JWT_ALGORITHM;

// Generate a  forgot password reset token
export const forgotPasswordResetToken = async (req, res, next) => {
	const { email } = req.body;
	const user = await User.findOne({ email });
	const token = crypto.randomUUID();
	if (!user || !token) {
		return res
			.status(401)
			.json({ error: "User or Password reset token is required!" });
	}
	console.log(token);
	// Send the response
	res.status(200).json({
		message: "Password reset token generated successfully",
		data: {
			resetToken: token, // You may omit this in production
			email: user.email,
		},
	});
};

//Reset password token function
export const resetPasswordToken = async (req, res, next) => {
	try {
		const { databaseToken } = req.params;

		// Ensure the token is provided
		if (!databaseToken) {
			return res.status(400).json({
				status: "error",
				message: "Token is required",
			});
		}

		// Hash the token
		const resetToken = crypto
			.createHash("sha256")
			.update(databaseToken)
			.digest("hex");

		console.log("Generated Reset Token:", resetToken);

		// Find a user with the hashed token and a valid expiration date
		const user = await User.findOne({
			resetPasswordToken: resetToken,
			resetPasswordExpires: { $gt: Date.now() }, // Ensure the token is not expired
		});

		// If no user is found, the token is invalid or expired
		if (!user) {
			return res.status(400).json({
				status: "error",
				message: "Invalid or expired token",
			});
		}

		// Token is valid, proceed to the next middleware or response
		res.status(200).json({
			status: "success",
			message: "Token is valid",
		});
	} catch (error) {
		console.error("Error processing reset password token:", error);
		next(error); // Pass the error to the error-handling middleware
	}
};

//Token Generation
export const generateToken = () => {
	const token = jwt.sign(data, secretKey, {
		expiresIn: tokenExpiration,
		algorithm: algorithm,
	});
	if (!secretKey || typeof secretKey !== "string" || secretKey.trim() === "") {
		console.error("The secret key is missing");
		throw new Error("JWT_SECRET must be a non-empty string");
	}
	return token;
};

export const verifyToken = (req, res, next) => {
	try {
		const token = req.header("Authorization")?.replace("Bearer ", ""); // Extract token from header
		if (!token) {
			return res.status(401).json({ error: "Authorization token is required" });
		}
		const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token with your secret key
		req.user = decoded; // Attach user data to request
		next();
	} catch (error) {
		return res.status(401).json({ error: "Invalid or expired token" });
	}
};
