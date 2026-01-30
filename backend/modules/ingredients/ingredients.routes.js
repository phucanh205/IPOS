import express from "express";
import { ingredientController } from "./ingredient.controller.js";

const router = express.Router();
router.get("/", ingredientController.list);

router.post("/", ingredientController.create);

router.put("/:id", ingredientController.update);

router.delete("/:id", ingredientController.remove);

export default router;
