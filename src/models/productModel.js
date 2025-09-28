import { model, Schema } from "mongoose";

const productSchema = new Schema(
	{
		name: String,
		category: {
			_id: {
				type: Schema.Types.ObjectId,
				ref: "Category",
				required: true,
			},
			name: {
				type: String,
				required: true,
			},
		},
		expiryDate: Date,
		quantity: Number,
		price: Number,
	},
	{ timestamps: true, required: true }
);

const Product = model("Product", productSchema);
export default Product;
