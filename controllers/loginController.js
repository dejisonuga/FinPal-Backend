import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import { sendResetPasswordEmail } from "../services/emailTransporter.js";
import {
	forgotPasswordResetToken,
	resetPasswordToken,
} from "./tokenController.js";

//Login function
export const login = async (req, res) => {
	try {
		const { fullName, password } = req.body;

		// Ensure that both username and password are provided in the request body
		if (!fullName || !password) {
			return res
				.status(400)
				.json({ message: "Fullname and password are required" });
		}

		// Find the user by username
		const user = await User.findOne({ fullName });

		// If the user is not found, return a 404 error
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Compare the password (plaintext password vs. hashed password)
		const validPassword = await bcrypt.compare(password, user.password);

		// If the password is invalid, return a 401 error (unauthorized)
		if (!validPassword) {
			return res.status(401).json({ message: "Invalid password" });
		}

		const lastLogin = Date(user.last_login);

		// Send the token and success message
		return res.json({
			message: "User login was successful!",
			lastLogin,
		});
	} catch (error) {
		console.error("Error during user login:", error);

		// Send a 500 status code for unexpected errors
		return res
			.status(500)
			.json({ message: "Internal Server Error during user login" });
	}
};

// Forgot password
export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;

		// Check if the user exists
		const user = await User.findOne({ email });
		if (!user) {
			return res
				.status(404)
				.json({ message: "User with this email does not exist" });
		}

		// Generate a random token and hash it
		const resetToken = crypto.randomBytes(32).toString("hex");
		const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

		// Set the reset token and its expiration time
		user.forgotPasswordResetToken = hashedToken;
		user.passwordResetTokenExpires = Date.now() + 3600000; // Token expires in 1 hour

		await user.save();

		// Generate the password reset link
		const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
		const emailText = `
			<h1>Password Reset Request</h1>
			<p>You requested to reset your password. Click the link below to proceed:</p>
			<a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none;">Reset Password</a>
			<p>If you didn’t request this, you can ignore this email.</p>
		`;

		// Send the email
		await sendResetPasswordEmail(email, "Password Reset Request", emailText);

		res.status(200).json({
			message: "Password reset instructions sent. Check your email.",
		});
	} catch (error) {
		console.error("Error in forgotPassword:", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
};


export const resetPassword = async (req, res, next) => {
	try {
		const { forgotPasswordResetToken } = req.params; // Token should come from params
		const { password } = req.body; // New password from request body

		// Log the incoming data for debugging
		console.log("Request Params:", req.params);
		console.log("Request Body:", req.body);

		// Validate request body
		if (!password) {
			return res.status(400).json({
				status: "error",
				message: "Password is required",
			});
		}

		// Find user with the provided reset token and check if token has expired
		const user = await User.findOne({
			databaseToken: forgotPasswordResetToken, // Match the token
			databasePasswordExpires: { $gt: Date.now() }, // Ensure token is still valid
		});

		if (!user) {
			return res.status(400).json({
				status: "error",
				message: "Token is invalid or has expired",
			});
		}

		// Hash the new password
		const salt = await bcrypt.genSalt(10);
		const newHashedPassword = await bcrypt.hash(password, salt);

		// Update user password and clear reset token fields
		user.password = newHashedPassword;
		user.databaseToken = null; // Clear the reset token
		user.databasePasswordExpires = null; // Clear the reset expiration time
		await user.save();

		// Generate a new token for the user after password reset
		const newToken = resetPasswordToken(user._id);

		// Respond with success message and the new token
		res.status(200).json({
			status: "success",
			data: {
				message: "Password reset successful",
				token: newToken,
			},
		});
	} catch (error) {
		// Log the error for debugging
		console.error("Error resetting password:", error);

		// Pass the error to the error-handling middleware
		next(error);
	}
};
