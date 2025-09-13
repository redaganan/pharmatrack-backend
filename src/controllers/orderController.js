import { Order } from "../models/index.js";
import { Product } from "../models/index.js";

const createOrder = async (request, response) => {
    try {
        const { orderId, purchaseDate, product, productId, totalAmount, quantity } = request.body;

        // Validate required fields
        const requiredFields = { orderId,  purchaseDate, product, productId, totalAmount, quantity };
        const missingFields = Object.entries(requiredFields).filter(([_, value]) => value === undefined || value === null || value === "");
    
        if (missingFields.length > 0) {
            return response.status(400).json({
                message: "All fields are required",
                missing_fields: missingFields.map(([key]) => key),
            });
        }

        // Find product by productId
        const productModel = await Product.findById(productId);
        if (!productModel) {
            return response.status(404).json({ message: "Product not found" });
        }

        const productQuantity = productModel.quantity;

        if (quantity > productQuantity) {
            return response.status(400).json({ message: "Insufficient product quantity" });
        }

        // Deduct the ordered quantity from the product's available quantity
        productModel.quantity -= quantity;
        await productModel.save();

        // Create new order
        const newOrder = new Order({
            orderId,
            purchaseDate,
            product,
            productId,
            totalAmount,
            quantity,
        });

        await newOrder.save();
        response.status(201).json({
            message: "Order created successfully",
            data: newOrder,
        });
    
    } catch (error) {
        response.status(500).json({ message: "Failed to create order" });
    }
};

export const recentOrders = async (request, response) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).limit(20); // Fetch the 20 most recent orders
        response.status(200).json(orders);
    } catch (error) {
        response.status(500).json({ message: "Failed to fetch recent orders" });
    }
};

export default {
    createOrder,
    recentOrders,
};
