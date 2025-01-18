import mongoose from "mongoose";

const errorHandler = (err, req, res, next) => {
	console.error(err);

	// Mongoose validation error
	if (err === mongoose.ValidationError) {
		console.error(`Validation error: ${err.message}`);
		return res.status(400).json({
			status: "error",
			message: "Validation error",
			details: err.errors,
		});
	}

	// Mongoose cast error
	if (err === mongoose.CastError) {
		console.error(`Cast error: ${err.message}`);
		return res.status(400).json({
			status: "error",
			message: "Invalid ID format",
		});
	}

	// Mongoose mongodb error
	if (err === mongoose.MongoError) {
		console.error(`MongoDB error: ${err.message}`);
		return res.status(500).json({
			status: "error",
			message: "MongoDB error",
		});
	}

	// JWT error handling
	if (err.name === "JsonWebTokenError") {
		return res.status(401).json({
			status: "error",
			message: "Invalid token",
		});
	}

	// Token expiration error handling
	if (err.name === "TokenExpiredError") {
		return res.status(401).json({
			status: "error",
			message: "Token expired",
		});
	}

	// Multer file size error handling
	if (err.code === "LIMIT_FILE_SIZE") {
		return res.status(400).json({
			status: "error",
			message: "File size too large",
		});
	}

	// Handle general errors
	res.status(err.status || 500).json({
		status: "error",
		message: err.message || "Internal server error",
	});
};

export default errorHandler;
