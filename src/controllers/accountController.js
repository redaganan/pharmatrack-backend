import { Account } from "../models/index.js";

const createAccount = async (req, res) => {
	try {
		const { email, username,  password } = req.body;
		const newAccount = new Account({ username, email, password });
		await newAccount.save();
		res.status(201).json({ message: "Account created successfully" });
	} catch (error) {
		res.status(500).json({ message: "Failed to create account" });
	}
};

export default {
	createAccount,
};
