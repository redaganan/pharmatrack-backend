import { Order } from "../models/index.js";

const createOrder = async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json({ message: "Order created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to create order" });
    }
};

export default {
    createOrder,
};
