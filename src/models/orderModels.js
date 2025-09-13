import { model, Schema } from "mongoose";

const orderSchema = new Schema(
	{
        orderId: String,
        productId: String,
		purchaseDate: Date,
		product: String,
		totalAmount: Number,
		quantity: Number,
	},
	{ timestamps: true }
);

const Order = model("Order", orderSchema);
export default Order;
