import { Product } from "../models/index.js";

const getProducts = async (req, res) => {
	try {
		const products = await Product.find();
		res.json({ data: products });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

export default {
	getProducts,
};
