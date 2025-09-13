import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import connectDB from "./config/database.js";

import accountRoutes from "./routes/accountRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(
	cors({
		credentials: true,
		origin: "http://localhost:5173",
	})
);

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/accounts", accountRoutes);

app.get("/", (_req, res) => {
	res.send("server is ready");
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
	console.log(`serve at http://localhost:${port}`);
});
