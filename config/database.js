import mongoose from "mongoose";

const uri = "mongodb://localhost:27017/finpal"; // connect the database URL

const connectToMongoDB = async () => {
	try {
		await mongoose.connect(uri);
		console.log("Connected to MongoDB");
	} catch (err) {
		console.error("Error connecting to MongoDB:", err);
	}
};

export default connectToMongoDB;
