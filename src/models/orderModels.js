import { model, Schema } from "mongoose";

const orderSchema = new Schema(
	{
		purchaseDate: Date,
		products: { type: Schema.Types.ObjectId, ref: "Product" },
		totalAmount: Number,
		quantity: Number,
	},
	{ timestamps: true }
);

const Order = model("Order", orderSchema);
export default Order;
