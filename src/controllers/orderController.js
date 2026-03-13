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
        const orders = await Order
            .find()
            .sort({ createdAt: -1 })
            .limit(1000)
            .lean(); // lean() returns plain objects so ALL stored fields are visible

        const result = [];

        for (const order of orders) {
            // --- Mobile app order: cart-based with items[] array ---
            if (Array.isArray(order.items) && order.items.length > 0) {
                for (const item of order.items) {
                    result.push({
                        orderId: order.orderId || String(order._id),
                        purchaseDate: order.purchaseDate || order.createdAt,
                        product: item.productName || item.product || 'Unknown Product',
                        productId: String(item.productId || ''),
                        quantity: item.quantity ?? 0,
                        price: item.price ?? 0,
                        totalAmount: item.subtotal ?? item.totalAmount ?? 0,
                    });
                }
            } else {
                // --- Web app flat order ---
                result.push({
                    orderId: order.orderId || String(order._id),
                    purchaseDate: order.purchaseDate || order.createdAt,
                    product: order.product || 'Unknown Product',
                    productId: String(order.productId || ''),
                    quantity: order.quantity ?? order.qty ?? 0,
                    price: order.price ?? 0,
                    totalAmount: order.totalAmount ?? 0,
                });
            }
        }

        response.status(200).json(result);
    } catch (error) {
        console.error('Failed to fetch recent orders:', error);
        response.status(500).json({ message: "Failed to fetch recent orders" });
    }
};

/**
 * Create a batch order (multiple items in one transaction).
 * Expects: { orderId, purchaseDate, items: [{ productId, product, quantity, price, totalAmount }] }
 * Creates a single Order document with items[] populated.
 */
const createBatchOrder = async (request, response) => {
    try {
        const { orderId, purchaseDate, items } = request.body;

        if (!orderId || !purchaseDate || !Array.isArray(items) || items.length === 0) {
            return response.status(400).json({ message: "orderId, purchaseDate, and a non-empty items array are required" });
        }

        // Validate stock and deduct quantities for every item
        for (const item of items) {
            const productModel = await Product.findById(item.productId);
            if (!productModel) {
                return response.status(404).json({ message: `Product not found: ${item.product || item.productId}` });
            }
            if (item.quantity > productModel.quantity) {
                return response.status(400).json({ message: `Insufficient stock for ${productModel.name || item.product}` });
            }
            productModel.quantity -= item.quantity;
            await productModel.save();
        }

        // Build the items sub-documents matching the schema
        const orderItems = items.map((i) => ({
            productId: String(i.productId),
            productName: i.product,
            price: i.price,
            quantity: i.quantity,
            subtotal: i.totalAmount,
        }));

        const totalAmount = items.reduce((s, i) => s + (i.totalAmount || 0), 0);

        const newOrder = new Order({
            orderId,
            purchaseDate,
            items: orderItems,
            totalAmount,
        });

        await newOrder.save();
        response.status(201).json({ message: "Batch order created successfully", data: newOrder });
    } catch (error) {
        console.error('Failed to create batch order:', error);
        response.status(500).json({ message: "Failed to create batch order" });
    }
};

export default {
    createOrder,
    createBatchOrder,
    recentOrders,
};
