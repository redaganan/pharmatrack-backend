import { Category, Product } from "../models/index.js";

const getProduct = async (request, response) => {
	try {
		// If an ID is provided, return the specific product
		const { id } = request.query;
		if (id) {
			const product = await Product.findById(id);
			if (!product) {
				return response
					.status(404)
					.json({ message: "Product not found" });
			}
			return response.json(product);
		}
		// If no ID is provided, return all products
		const products = await Product.find();
		response.json(products);
	} catch (error) {
		response.status(500).json({ message: error.message });
	}
};

const createProduct = async (request, response) => {
	try {
		const { name, categoryId, expiryDate, quantity, price } = request.body;

		if (!name || !categoryId || !expiryDate || !quantity || !price) {
			return response
				.status(400)
				.json({ message: "All fields are required" });
		}

		const category = await Category.findById(categoryId);
		if (!category) {
			return response.status(404).json({ message: "Category not found" });
		}

		const newProduct = new Product({
			name,
			category: { _id: category._id, name: category.name },
			expiryDate,
			quantity,
			price,
		});
		await newProduct.save();

		response.status(201).json({
			message: "Product created successfully",
			data: newProduct,
		});
	} catch (error) {
		response.status(500).json({ message: error.message });
	}
};

const updateProduct = async (request, response) => {
	try {
		const { id } = request.query;
		const product = await Product.findById(id);

		if (!product) {
			return response.status(404).json({ message: "Product not found" });
		}

		const updatedProductFields = request.body;

		const missingFields = Object.entries(updatedProductFields).filter(
			([key, value]) => !value
		);

		if (missingFields.length > 0) {
			return response.status(400).send({
				message: "All fields are required",
				missing_fields: missingFields.map(([key]) => key),
			});
		}
		const { categoryId } = updatedProductFields;

		if (categoryId) {
			const category = await Category.findById(categoryId);
			if (!category) {
				return response
					.status(404)
					.json({ message: "Category not found" });
			}
		}

		Object.assign(product, updatedProductFields); // Update product fields
		await product.save(); // Save the updated product
		response.json({
			message: "Product updated successfully",
			data: product,
		});
	} catch (error) {
		response.status(500).json({ message: error.message });
	}
};

const deleteProduct = async (request, response) => {
	try {
		const { id } = request.query;
		const product = await Product.findById(id);
		if (!product) {
			return response.status(404).json({ message: "Product not found" });
		}

		await Product.findByIdAndDelete(id);
		response.json({ message: "Product deleted successfully" });
	} catch (error) {
		response.status(500).json({ message: error.message });
	}
};

export default {
	getProduct,
	createProduct,
	updateProduct,
	deleteProduct,
};
