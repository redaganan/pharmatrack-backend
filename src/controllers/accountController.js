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
			return response.status(400).json({
				status: "error",
				message: "Username and password are required",
			});
		}

		const account = await Account.findOne({ username, password });

		if (!account) {
			return response.status(401).json({
				status: "error",
				message: "Invalid username or password",
			});
		}

		return response.status(200).json({
			status: "success",
			message: "Login successful",
			accountId: account._id,
            username: account.username,
		});
	} catch (error) {
		response
			.status(500)
			.json({ status: "error", message: "Failed to login" });
	}
};

const changePassword = async (request, response) => {
	try {
		const { current_password, new_password, confirm_password } = request.body;

		const requiredFields = {
			current_password,
			new_password,
			confirm_password,
		};
		const missingFields = Object.entries(requiredFields).filter(
			([_, value]) =>
				value === undefined || value === null || value === ""
		);
		if (missingFields.length > 0) {
			return response.status(400).json({
				message: "All fields are required",
				missing_fields: missingFields.map(([key]) => key),
			});
		}

		const { accountId } = request.query;
		const account = await Account.findById(accountId);
		if (!account) {
			return response.status(404).json({ message: "Account not found" });
		}

		if (account.password !== current_password) {
			return response
				.status(401)
				.json({ message: "Current password is incorrect" });
		}

        if (current_password === new_password) {
            return response
                .status(400)
                .json({ message: "New password must be different from current password" });
        }

		if (new_password !== confirm_password) {
			return response
				.status(400)
				.json({
					message: "New password and confirm password do not match",
				});
		}

		account.password = new_password;
		await account.save();
		response.status(200).json({ message: "Password changed successfully" });
	} catch (error) {
		response.status(500).json({ message: "Failed to change password" });
	}
};



export default {
	createAccount,
	loginAccount,
	changePassword,
};
