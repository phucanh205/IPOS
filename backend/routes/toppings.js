import express from "express";
import { toppingController } from "../controllers/toppingController.js";

const router = express.Router();

router.get("/", toppingController.list);

export default router;
