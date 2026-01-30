import express from "express";
import { recipeController } from "./recipe.controller.js";

const router = express.Router();

router.get("/product/:productId", recipeController.getByProduct);

router.patch("/product/:productId/active", recipeController.setActive);

router.put("/product/:productId", recipeController.upsertByProduct);

router.delete("/product/:productId", recipeController.removeByProduct);

export default router;
