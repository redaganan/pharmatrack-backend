import { Router } from "express";

import dashboardController from "../controllers/dashboardController.js";
const router = Router();

router.get("/data", dashboardController.getDashboardData);
router.post("/notify-expiry", dashboardController.notifySoonToExpireProducts);

export default router;