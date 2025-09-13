import { Router } from "express";

import orderController from "../controllers/orderController.js";

const router = Router();


router.post("/create-order", orderController.createOrder);
router.get("/recent-orders", orderController.recentOrders);

export default router;