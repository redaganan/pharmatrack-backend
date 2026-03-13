import { Router } from "express";

import orderController from "../controllers/orderController.js";

const router = Router();


router.post("/create-order", orderController.createOrder);
router.post("/create-batch-order", orderController.createBatchOrder);
router.get("/recent-orders", orderController.recentOrders);

export default router;