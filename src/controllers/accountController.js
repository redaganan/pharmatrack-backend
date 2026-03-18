import nodemailer from "nodemailer";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

import { Account, VerifyOTP } from "../models/index.js";

const SALT_ROUNDS = 10;

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

		const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
		const newAccount = new Account({ username, email, password: hashedPassword });
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

		const account = await Account.findOne({ username });

		if (!account) {
			return response.status(401).json({
				status: "error",
				message: "Invalid username or password",
			});
		}

		const isPasswordValid = await bcrypt.compare(password, account.password);
		if (!isPasswordValid) {
			return response.status(401).json({
				status: "error",
				message: "Invalid username or password",
			});
		}

        // Email setup
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

		const createOTPCode = Math.floor(
			1000 + Math.random() * 9000
		).toString();
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

		// Log OTP to console so you can always see it even if email fails
		console.log(`\n========================================`);
		console.log(`  OTP for ${username}: ${createOTPCode}`);
		console.log(`  Sending to: ${account.email}`);
		console.log(`  Valid until: ${expiresAt.toLocaleTimeString()}`);
		console.log(`========================================\n`);

		const newOTP = new VerifyOTP({
			user_id: account._id,
			email: account.email,
			otpCode: createOTPCode,
			expiresAt,
		});
		await newOTP.save();

		// Send OTP email (don't let email failure block login)
		let emailSent = false;
		try {
			const mailOptions = {
				from: process.env.EMAIL_USER,
				to: account.email,
				subject: "PharmaTrack - Your OTP Code",
				html: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
						<h2 style="color: #f45b69;">PharmaTrack Login Verification</h2>
						<p>Hello <strong>${username}</strong>,</p>
						<p>Your OTP code is:</p>
						<div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
							<h1 style="color: #2c3e50; letter-spacing: 8px; margin: 0;">${createOTPCode}</h1>
						</div>
						<p>This code is valid for <strong>10 minutes</strong>.</p>
						<p style="color: #888;">If you didn't request this code, please ignore this email.</p>
					</div>
				`,
			};

			await transporter.sendMail(mailOptions);
			emailSent = true;
			console.log(`Email sent successfully to ${account.email}`);
		} catch (emailError) {
			console.error("Failed to send OTP email:", emailError.message);
			console.log("Check your OTP in the console output above ^");
		}

		return response.status(200).json({
			status: "success",
			message: emailSent
				? "Login successful. OTP sent to your email."
				: "Login successful. Email delivery failed — use the OTP shown below.",
			accountId: account._id,
			username: account.username,
			emailSent,
			...(!emailSent && { otp: createOTPCode }),
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

		const isCurrentPasswordValid = await bcrypt.compare(current_password, account.password);
		if (!isCurrentPasswordValid) {
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

		const hashedNewPassword = await bcrypt.hash(new_password, SALT_ROUNDS);
		account.password = hashedNewPassword;
		await account.save();
		response.status(200).json({ message: "Password changed successfully" });
	} catch (error) {
		response.status(500).json({ message: "Failed to change password" });
	}
};

const changeUsername = async (request, response) => {
	try {
		const { username } = request.body;
		const { accountId } = request.query;

		if (!accountId) {
			return response
				.status(400)
				.json({ status: "error", message: "Account ID is required" });
		}

		const trimmedUsername = username?.trim();
		if (!trimmedUsername) {
			return response.status(400).json({
				status: "error",
				message: "Username is required",
			});
		}

		const account = await Account.findById(accountId);
		if (!account) {
			return response
				.status(404)
				.json({ status: "error", message: "Account not found" });
		}

		if (account.username === trimmedUsername) {
			return response.status(400).json({
				status: "error",
				message: "New username must be different from current username",
			});
		}

		const existingUsername = await Account.findOne({ username: trimmedUsername });
		if (existingUsername && existingUsername._id.toString() !== accountId) {
			return response.status(400).json({
				status: "error",
				message: "Username is already taken",
			});
		}

		account.username = trimmedUsername;
		await account.save();

		return response.status(200).json({
			status: "success",
			message: "Username changed successfully",
			username: account.username,
		});
	} catch (error) {
		return response
			.status(500)
			.json({ status: "error", message: "Failed to change username" });
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
	changeUsername,
	verifyLoginAccountOTP,
};
