import {model, Schema} from "mongoose";

const accountSchema = new Schema(
    {
        email: String,
        username: String,
        password: String,
    },
    { timestamps: true }
);

const Account = model("Account", accountSchema);
export default Account;
