import User from "../models/userModel.js";
import { generateToken } from "./tokenController.js";
// import bcrypt from "bcryptjs";

// Register new user
export const register = async (req, res, next) => {
	try {
		const { fullName, email, password, confirmPassword } = req.body;
		const cleanedPassword = password.trim();
		// Check if the passwords match
		if (password !== confirmPassword) {
			return res.status(400).json({ message: "Passwords do not match." });
		}

		// Create user
		const user = await User.create({
			fullName,
			email,
			password: cleanedPassword,
		});

		// Generate token
		const newUserToken = generateToken(user._id);

		// Send the response
		res.status(201).json({
			status: "success",
			data: {
				user,
				newUserToken,
			},
			message: "New User created successfully",
		});
	} catch (error) {
		next(error);
	}
};

// Get users
export const getUsers = async (req, res, next) => {
	try {
		const users = await User.find();
		res.status(200).json({
			status: "success",
			data: users,
			message: "Fetched user(s) successfully",
		});
	} catch (error) {
		next(error);
	}
};

// Find a user
export const findUser = async (req, res, next) => {
	const { fullName } = req.body;

	if (!fullName) {
		return res.status(400).json({
			status: "error",
			message: "Username is required",
		});
	}

	try {
		// Attempt to find the user by username
		const result = await User.find({ fullName });

		// If no user is found
		if (result.length === 0) {
			return res.status(404).json({
				status: "error",
				message: "User not found",
			});
		}

		// If user is found, return user data
		res.status(200).json({
			status: "success",
			data: result,
			message: "Fetched user(s) successfully",
		});
	} catch (error) {
		// If an error occurs, pass it to the error handling middleware
		next(error);
	}
};

// Delete a user
export const deleteUser = async (req, res, next) => {
	const { fullName } = req.body; // Get the username from request params

	try {
		// Find the user to check if they exist
		const user = await User.findOne({ fullName });

		if (!user) {
			// If user not found
			return res.status(404).json({ error: "User not found" });
		}

		// Delete the user by username
		await User.findOneAndDelete({ fullName });

		// If the user was found and deleted
		res.status(200).json({
			message: "User details deleted successfully",
			data: user,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
};

// Update user details
export const updateUsers = async (req, res, next) => {
	try {
		const { fullName, email } = req.body; // Destructure the values from req.body
		const updates = Object.keys(req.body); // Get all the fields being updated
		const allowedUpdates = ["fullName", "email"]; // Define allowed fields to update

		// Check if the updates are valid
		const isValidUpdate = updates.every((update) =>
			allowedUpdates.includes(update)
		);

		// If any invalid fields are provided in the update, return an error
		if (!isValidUpdate) {
			return res.status(400).send({
				error: "Invalid updates. Only 'fullNamee' and 'email' can be updated.",
			});
		}

		// Check if fullname is provided
		if (!fullName) {
			return res.status(400).send({
				error: "Fullname is required to update user data.",
			});
		}

		// Optional: Validate email format if provided
		if (email && !/^\S+@\S+\.\S+$/.test(email)) {
			return res.status(400).send({
				error: "Invalid email format.",
			});
		}

		// Create filter object to find the user (based on username in this case)
		const filter = {}; // Assuming you're identifying the user by their username

		// Create the update object
		const update = {}; // Initialize the update object
		if (email) update.email = email; // Only update fields that are present
		if (fullName) update.fullName = fullName;

		// Perform the update using findOneAndUpdate
		const user = await User.findOneAndUpdate(
			filter,
			{ $set: update },
			{ new: true, runValidators: true }
		);

		// If no user is found, return a 404 error
		if (!user) {
			return res.status(404).send({ error: "User not found" });
		}

		// Send the updated user details
		res.status(200).send({
			message: "User updated successfully",
			user, // Send the updated user data back
		});
	} catch (error) {
		// Handle server errors
		console.error(error);
		res.status(500).send({ error: "Internal Server Error" });
	}
};
