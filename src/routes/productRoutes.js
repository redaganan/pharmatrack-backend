import { Router } from "express";

import productController from "../controllers/productController.js";

const router = Router();

router.get("/get-product", productController.getProduct);
router.post("/create-product", productController.createProduct);
router.put("/update-product", productController.updateProduct);
router.delete("/delete-product", productController.deleteProduct);

export default router;
