import { Account } from "../models/index.js";

import isValidEmail from "../utils/validEmail.js";

const createAccount = async (request, response) => {
	try {
		const { email, username, password } = request.body;

		if (!email || !username || !password) {
			return response.status(400).json({
				status: "error",
				message: "Email, username, and password are required",
			});
		}

		const existingEmail = await Account.findOne({ email });
		if (existingEmail) {
			return response.status(400).json({
				status: "error",
				message: "Email is already taken",
			});
		}
		if (!isValidEmail(email)) {
			return response.status(400).json({
				status: "error",
				message: "Invalid email format",
			});
		}
		const existingUsername = await Account.findOne({ username });
		if (existingUsername) {
			return response.status(400).json({
				status: "error",
				message: "Username is already taken",
			});
		}

		const newAccount = new Account({ username, email, password });
		await newAccount.save();
		return response.status(201).json({
			status: "success",
			message: "Account created successfully",
		});
	} catch (error) {
		return response.status(500).json({
			status: "error",
			message: "Failed to create account",
		});
	}
};

const loginAccount = async (request, response) => {
	try {
		const { username, password } = request.body;

		if (!username || !password) {
			return response
				.status(400)
				.json({
					status: "error",
					message: "Username and password are required",
				});
		}

		const account = await Account.findOne({ username, password });

		if (!account) {
			return response
                .status(401)
                .json({
                    status: "error",
                    message: "Invalid username or password",
                });
		} 

        return response.status(200).json({
            status: "success",
            message: "Login successful",
        });
	} catch (error) {
		res.status(500).json({ status: "error", message: "Failed to login" });
	}
};

export default {
	createAccount,
	loginAccount,
};
