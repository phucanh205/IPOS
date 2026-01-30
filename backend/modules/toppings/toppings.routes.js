import express from "express";
import { toppingController } from "./topping.controller.js";

const router = express.Router();

router.get("/", toppingController.list);

export default router;
