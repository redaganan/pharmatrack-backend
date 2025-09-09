import { model, Schema } from "mongoose";

const productSchema = new Schema(
	{
		name: String,
		expiryDate: Date,
		quantity: Number,
		price: Number,
	},
	{ timestamps: true }
);

const Product = model("Product", productSchema);
export default Product;
