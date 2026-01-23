import express from "express";
import Ingredient from "../models/Ingredient.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const ingredients = await Ingredient.find({
            group: { $regex: /^topping$/i },
        }).sort({ name: 1 });

        const items = ingredients.map((ing) => ({
            _id: ing._id,
            name: ing.name,
        }));

        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
