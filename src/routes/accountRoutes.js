import { Router } from "express";

import accountController from "../controllers/accountController.js";

const router = Router();

router.post("/create-account", accountController.createAccount);
router.post("/login", accountController.loginAccount);

export default router;
