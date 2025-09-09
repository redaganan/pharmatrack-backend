import mongoose from "mongoose";

const connectDB = async () => {
	try {
		await mongoose.connect("mongodb://localhost:27017/pharmatrack");
		console.log("database connected");
	} catch (error) {
		console.error(`${error} did not connect`);
		process.exit(1);
	}
};

export default connectDB;
