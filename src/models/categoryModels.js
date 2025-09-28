import { model, Schema } from "mongoose";

const categorySchema = new Schema(
	{
		name: String,
	},
	{ timestamps: true }
);

const Category = model("Category", categorySchema);

export default Category;
