import { model, Schema } from "mongoose";

const verifyOTPSchema = new Schema(
	{
		user_id: { type: Schema.Types.ObjectId, ref: "Account" },
		email: String,
		otpCode: String,
		expiresAt: Date,
        used: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

const VerifyOTP = model("VerifyOTP", verifyOTPSchema);
export default VerifyOTP;
