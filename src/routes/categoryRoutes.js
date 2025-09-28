import { Router } from "express";

import categoryController from "../controllers/categoryController.js";

const router = Router();

router.get("/get-category", categoryController.getCategory);
router.post("/create-category", categoryController.createCategory);
router.put("/update-category", categoryController.updateCategory);

export default router;
