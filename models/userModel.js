import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // For hashing passwords

const userSchema = new mongoose.Schema(
	{
		fullName: {
			type: String,
			required: true,
			unique: true, // Ensures username is unique
			minlength: 3, // Username must be at least 3 characters long
			maxlength: 50, // Username max length
		},
		email: {
			type: String,
			required: true,
			unique: true, // Ensures email is unique
			minlength: 3, // Username must be at least 3 characters long
		},
		password: {
			type: String,
			required: true,
			minlength: 6, // Minimum password length
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		passwordResetTokenExpiration: {
			type: Date,
		},
		emailVerificationOTP: {
			type: String,
		},
		profilePicture: {
			type: String,
		},
		role: {
			type: String,
			enum: ["customer", "vendor"],
			default: "customer",
		},
	},
	{ timestamps: true }
);

// Pre-save middleware to hash the password before saving
userSchema.pre("save", async function (next) {
	try {
		if (this.isModified("password")) {
			const salt = await bcrypt.genSalt(10);
			this.password = await bcrypt.hash(this.password, salt);
		}
		next();
	} catch (error) {
		next(error); // Pass errors to the next middleware or error handler
	}
});

// Method to check if the provided password matches the hashed password
userSchema.methods.comparePassword = async function (password) {
	const user = this;
	return await bcrypt.compare(password, user.password);
};

const User = mongoose.model("User", userSchema);

export default User;
