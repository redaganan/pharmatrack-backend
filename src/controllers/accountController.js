import nodemailer from "nodemailer";
import dotenv from "dotenv";

import { Account, VerifyOTP } from "../models/index.js";

import isValidEmail from "../utils/validEmail.js";

dotenv.config();

const createAccount = async (request, response) => {
	try {
		const { email, username, password } = request.body;

		if (!email || !username || !password) {
			return response.status(400).json({
				status: "error",
				message: "Email, username, and password are required",
			});
		}

		const passwordRegex =
			/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/;
		if (!passwordRegex.test(password)) {
			return response.status(400).json({
				status: "error",
				message:
					"Password must be 8-20 characters long and contain at least one uppercase letter, one number, and one special character",
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

        // Email setup (replace with actual credentials and owner email)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

		const createOTPCode = Math.floor(
			1000 + Math.random() * 9000
		).toString();
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

		const newOTP = new VerifyOTP({
			user_id: account._id,
			email: account.email,
			otpCode: createOTPCode,
			expiresAt,
		});
		await newOTP.save();

		// Send OTP email
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: account.email,
			subject: "Your OTP Code",
			text: `Your OTP code is ${createOTPCode}. It is valid for 10 minutes.`,
		};

		await transporter.sendMail(mailOptions);

		return response.status(200).json({
			status: "success",
			message: "Login successful",
			accountId: account._id,
			username: account.username,
		});
	} catch (error) {
		console.error("Login error:", error);
		response
			.status(500)
			.json({ status: "error", message: "Failed to login" });
	}
};

const changePassword = async (request, response) => {
	try {
		const { current_password, new_password, confirm_password } =
			request.body;

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
			return response.status(400).json({
				message: "New password must be different from current password",
			});
		}

		if (new_password !== confirm_password) {
			return response.status(400).json({
				message: "New password and confirm password do not match",
			});
		}

		const passwordRegex =
			/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/;
		if (!passwordRegex.test(new_password)) {
			return response.status(400).json({
				status: "error",
				message:
					"Password must be 8-20 characters long and contain at least one uppercase letter, one number, and one special character",
			});
		}

		account.password = new_password;
		await account.save();
		response.status(200).json({ message: "Password changed successfully" });
	} catch (error) {
		response.status(500).json({ message: "Failed to change password" });
	}
};

const verifyLoginAccountOTP = async (request, response) => {
	try {
		const { username } = request.query;
		const { otp } = request.body;

		if (!username) {
			return response.status(400).json({
				status: "error",
				message: "Username is required",
			});
		}
		if (!otp) {
			return response.status(400).json({
				status: "error",
				message: "OTP is required",
			});
		}

		const account = await Account.findOne({ username });
		if (!account) {
			return response.status(404).json({
				status: "error",
				message: "Account not found",
			});
		}

		// Verify OTP
		const validOTP = await VerifyOTP.findOne({
			user_id: account._id,
			otpCode: otp,
			expiresAt: { $gt: new Date() },
			used: false,
		});

		if (!validOTP) {
			return response.status(400).json({
				status: "error",
				message: "Invalid or expired OTP",
			});
		}

		// Mark OTP as used
		validOTP.used = true;
		await validOTP.save();

		response.status(200).json({
			status: "success",
			message: "Logged in successfully",
		});
	} catch (error) {
		response
			.status(500)
			.json({ status: "error", message: "Failed to login with OTP" });
	}
};

export default {
	createAccount,
	loginAccount,
	changePassword,
	verifyLoginAccountOTP,
};
