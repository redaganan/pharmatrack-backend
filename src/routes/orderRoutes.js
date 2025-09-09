import { Router } from "express";

import orderController from "../controllers/orderController.js";

const router = Router();


router.post("/create-order", orderController.createOrder);

export default router;