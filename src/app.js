// Load environment variables
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import connectToMongoDB from "../config/database.js";
import errorHandler from "../middlewares/errorHandler.js";
import swaggerUi from "swagger-ui-express";
import { specs } from "../config/swagger.js";
import apiRoutes from "../routes/apiRoutes.js";
import bodyParser from "body-parser";
import mongoose from "mongoose";

dotenv.config();

// Create Express app
const app = express();
app.use(express.json());

const corsOptions = {
	origin: [
		"http://localhost:3001",
		"http://localhost:3000",
		"http://localhost:3002",
	],
	methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
	credentials: true,
	optionsSuccessStatus: 204,
	allowedHeaders: "Content-Type, Authorization",
};

// Handle preflight requests
app.options("*", cors(corsOptions));

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//Detailed Mongoose connection settings
mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("Connected to MongoDB"))
	.catch((err) => console.error("MongoDB connection error:", err));

console.log("MONGO_URI:", process.env.MONGO_URI);

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Swagger Documentation
app.use(
	"/api-docs",
	swaggerUi.serve,
	swaggerUi.setup(specs, { explorer: true })
);

// Routes
app.use("/api", apiRoutes);

// Error handling
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
	res.status(404).json({
		status: "error",
		message: "Route not found",
	});
});

// Start server
const PORT = process.env.PORT || 3001;
const startServer = async () => {
	try {
		// Connect to database
		await connectToMongoDB();

		// Start listening
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
};
startServer();
