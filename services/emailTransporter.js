import nodemailer from "nodemailer";
import { forgotPasswordResetToken } from "../controllers/tokenController.js";
import User from "../models/userModel.js";

export const sendResetPasswordEmail = async (req, res, next) => {
	try {
		const { email } = req.body; // Extract email string from req.body

		if (!email) {
			return res.status(400).json({ error: "Email is required" });
		}

		const user = await User.findOne({ email }); // Use email string to find the user
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST,
			port: process.env.EMAIL_PORT,
			secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
			tls: {
				rejectUnauthorized: false,
			},
		});

		const resetURL = `${
			process.env.FRONTEND_URL || "http://localhost:3000"
		}/forgot-password/?token=${forgotPasswordResetToken}`;

		const emailMessage = {
			from: process.env.EMAIL_USER,
			to: email, // Send to the email address
			subject: "Password Reset Request",
			html: `
		  <h1>You have requested a password reset</h1>
		  <p>Please click on the following link to reset your password:</p>
		  <a href="${resetURL}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block;">
			Reset Your Password
		  </a>
		  <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
		  <p>This link will expire in 30 minutes.</p>
		`,
		};

		await transporter.sendMail(emailMessage);

		return res
			.status(200)
			.json({ message: "Password reset email sent successfully" });
	} catch (error) {
		console.error("Error sending password reset email:", error);
		return res
			.status(500)
			.json({ error: `Failed to send reset password email: ${error.message}` });
	}
};


