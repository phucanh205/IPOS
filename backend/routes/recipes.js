import express from "express";
import mongoose from "mongoose";
import Recipe from "../models/Recipe.js";

const router = express.Router();

router.get("/product/:productId", async (req, res) => {
    try {
        const { productId } = req.params || {};
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: "Invalid productId" });
        }

        const recipe = await Recipe.findOne({ product: productId }).populate(
            "items.ingredient",
            "name unit baseUnit displayUnit conversionFactor"
        );

        if (!recipe) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        res.json(recipe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/product/:productId", async (req, res) => {
    try {
        const { productId } = req.params || {};
        const { items } = req.body || {};

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: "Invalid productId" });
        }

        if (!Array.isArray(items)) {
            return res.status(400).json({ error: "items must be an array" });
        }

        const normalizedItems = [];
        for (const row of items) {
            const ingId = row?.ingredient || row?.ingredientId;
            const qtyRaw = row?.quantity;
            if (!mongoose.Types.ObjectId.isValid(ingId)) {
                return res.status(400).json({ error: "Invalid ingredient id in items" });
            }
            const qty = Number(qtyRaw);
            if (Number.isNaN(qty) || qty <= 0) {
                return res.status(400).json({ error: "Invalid quantity in items" });
            }
            normalizedItems.push({ ingredient: ingId, quantity: qty });
        }

        const upserted = await Recipe.findOneAndUpdate(
            { product: productId },
            { product: productId, items: normalizedItems, updatedAt: Date.now() },
            { new: true, upsert: true, runValidators: true }
        ).populate("items.ingredient", "name unit baseUnit displayUnit conversionFactor");

        res.json(upserted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/product/:productId", async (req, res) => {
    try {
        const { productId } = req.params || {};
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: "Invalid productId" });
        }

        const deleted = await Recipe.findOneAndDelete({ product: productId });
        if (!deleted) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
