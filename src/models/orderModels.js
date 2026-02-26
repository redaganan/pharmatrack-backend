import { model, Schema } from "mongoose";

const orderSchema = new Schema(
	{
        orderId: String,
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
		purchaseDate: Date,
		product: String,
		totalAmount: Number,
		quantity: Number,
        // Mobile app cart-based order fields
        items: [
            {
                productId: String,
                productName: String,
                price: Number,
                quantity: Number,
                subtotal: Number,
            }
        ],
        amountPaid: Number,
        change: Number,
	},
	{ timestamps: true }
);

const Order = model("Order", orderSchema);
export default Order;
