import { Order, Product } from "../models/index.js";

const getDashboardData = async (request, response) => {
	try {
		const totalProducts = await Product.countDocuments();
		const recentOrdersToday = await Order.find({
			purchaseDate: {
				$gte: new Date(new Date().setHours(0, 0, 0, 0)),
				$lt: new Date(new Date().setHours(23, 59, 59, 999)),
			},
		}).sort({ purchaseDate: -1 });
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
				recentOrdersToday: recentOrdersToday.length,
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

export default { getDashboardData };
