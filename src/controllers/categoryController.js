import { Category, Product } from "../models/index.js";

const getCategory = async (request, response) => {
	try {
		// If an ID is provided, return the specific category
		const { id } = request.query;
		if (id) {
			const category = await Category.findById(id);
			if (!category) {
				return response
					.status(404)
					.json({ message: "Category not found" });
			}
			return response.json(category);
		}
		// If no ID is provided, return all categories
		const categories = await Category.find();
		response.json(categories);
	} catch (error) {
		response.status(500).json({ message: error.message });
	}
};

const createCategory = async (request, response) => {
	try {
		const { name } = request.body;

		if (!name) {
			return response
				.status(400)
				.json({ message: "Category name is required" });
		}

		// Check if category with the same name already exists (case-insensitive)
		const existingCategory = await Category.findOne({
			name: { $regex: `^${name}$`, $options: "i" },
		});
		if (existingCategory) {
			return response
				.status(400)
				.json({ message: "Category with this name already exists" });
		}

		const newCategory = new Category({ name });

		await newCategory.save();
		response.status(201).json(newCategory);
	} catch (error) {
		response.status(500).json({ message: error.message });
	}
};

const updateCategory = async (request, response) => {
	try {
		const { id } = request.query;
		const category = await Category.findById(id);
		if (!category) {
			return response.status(404).json({ message: "Category not found" });
		}
		const { name } = request.body;

		if (!name) {
			return response
				.status(400)
				.json({ message: "Category name is required" });
		}

        // Check if another category with the same name already exists (case-insensitive)
        const existingCategory = await Category.findOne({
            name: { $regex: `^${name}$`, $options: "i" },
            _id: { $ne: id } // Exclude the current category from the search
        });
		if (existingCategory) {
			return response
				.status(400)
				.json({ message: "Category with this name already exists" });
		}
		category.name = name;
		await category.save();
		response.json(category);
	} catch (error) {
		response.status(500).json({ message: error.message });
	}
};

const deleteCategory = async (request, response) => {
	try {
		const { id } = request.query;
		const category = await Category.findById(id);
		if (!category) {
			return response.status(404).json({ message: "Category not found" });
		}
		// Delete the category
		await Category.findByIdAndDelete(id);
		// Set category to null in all products that had this category
		await Product.updateMany(
			{ "category._id": category._id },
			{ $set: { category: null } }
		);
		response.json({ message: "Category deleted and products updated" });
	} catch (error) {
		response.status(500).json({ message: error.message });
	}
};

export default { getCategory, createCategory, updateCategory, deleteCategory };
