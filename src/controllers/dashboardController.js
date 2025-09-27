import dotenv from "dotenv";
import nodemailer from "nodemailer";

import { Order, Product } from "../models/index.js";

dotenv.config();

const getDashboardData = async (request, response) => {
	try {
		const totalProducts = await Product.countDocuments();
		// Sum total quantity of orders placed today
		const recentOrdersToday = await Order.find({
			purchaseDate: {
				$gte: new Date(new Date().setHours(0, 0, 0, 0)),
				$lt: new Date(new Date().setHours(23, 59, 59, 999)),
			},
		}).sort({ purchaseDate: -1 });
        // Sum total stock quantity of all products
		const totalProductsStock = await Product.aggregate([
			{
				$group: {
					_id: null,
					totalQuantity: { $sum: "$quantity" },
				},
			},
		]);
		const soonToExpireProducts = await Product.find({
			expiryDate: {
				$gte: new Date(),
				$lte: new Date(new Date().setDate(new Date().getDate() + 30)), // Products expiring in the next 30 days
			},
		}).sort({ expiryDate: 1 });
		const outOfStockProducts = await Product.find({
			quantity: { $lte: 0 },
		});
		const lowStockProducts = await Product.find({
			quantity: { $gte: 1, $lte: 10 },
		});
		const revenueToday = await Order.aggregate([
			{
				$match: {
					purchaseDate: {
						$gte: new Date(new Date().setHours(0, 0, 0, 0)),
						$lt: new Date(new Date().setHours(23, 59, 59, 999)),
					},
				},
			},
			{
				$group: {
					_id: null,
					totalRevenue: { $sum: "$totalAmount" },
				},
			},
		]);
		response.status(200).json({
			message: "Dashboard data fetched successfully",
			data: {
				totalProducts,
				totalProductsStock: totalProductsStock[0]?.totalQuantity || 0,
				recentOrdersToday: recentOrdersToday.length || 0,
				soonToExpireProducts: soonToExpireProducts.map(
					(product) => product.name
				),
				outOfStockProducts: outOfStockProducts.map(
					(product) => product.name
				),
				lowStockProducts: {
					name: lowStockProducts.map((product) => product.name),
					quantity: lowStockProducts.map(
						(product) => product.quantity
					),
				},
				revenueToday: revenueToday[0]?.totalRevenue || 0,
			},
		});
	} catch (error) {
		response
			.status(500)
			.json({ message: "Failed to fetch dashboard data" });
	}
};

const notifySoonToExpireProducts = async (request, response) => {
	try {
		const soonToExpireProducts = await Product.find({
			expiryDate: {
				$gte: new Date(),
				$lte: new Date(new Date().setDate(new Date().getDate() + 30)), // Products expiring in the next 30 days
			},
		}).sort({ expiryDate: 1 });

		// Email setup (replace with actual credentials and owner email)
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});

		const ownerEmail = process.env.OWNER_EMAIL || "gera.aganan.sjc@phinmaed.com";
		const productList = soonToExpireProducts
			.map(
				(product) =>
					`${
						product.name
					} (expires: ${product.expiryDate.toDateString()})`
			)
			.join("\n");

		const mailOptions = {
			from: process.env.NOTIFY_EMAIL_USER,
			to: ownerEmail,
			subject: "Soon-to-Expire Products Notification",
			text:
				soonToExpireProducts.length > 0
					? `The following products are expiring within the next 30 days:\n\n${productList}`
					: "No products are expiring within the next 30 days.",
		};

		await transporter.sendMail(mailOptions);

		response.status(200).json({
			message: "Email notification sent for soon-to-expire products",
		});
	} catch (error) {
		response.status(500).json({
			message: "Failed to notify about soon-to-expire products",
			error: error.message,
		});
	}
};

export default { getDashboardData, notifySoonToExpireProducts };
