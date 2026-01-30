import mongoose from "mongoose";
import Recipe from "./recipe.model.js";

export const recipeService = {
    async getByProduct(productId) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Invalid productId" };
            throw err;
        }

        const recipe = await Recipe.findOne({ product: productId }).populate(
            "items.ingredient",
            "name unit baseUnit displayUnit conversionFactor"
        );

        if (!recipe) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Recipe not found" };
            throw err;
        }

        return recipe;
    },

    async setActive(productId, { isActive }) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Invalid productId" };
            throw err;
        }

        const nextActive = Boolean(isActive);

        const updated = await Recipe.findOneAndUpdate(
            { product: productId },
            { $set: { isActive: nextActive, updatedAt: Date.now() } },
            { new: true }
        ).populate("items.ingredient", "name unit baseUnit displayUnit conversionFactor");

        if (!updated) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Recipe not found" };
            throw err;
        }

        return updated;
    },

    async upsertByProduct(productId, { items }) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Invalid productId" };
            throw err;
        }

        if (!Array.isArray(items)) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "items must be an array" };
            throw err;
        }

        const normalizedItems = [];
        for (const row of items) {
            const ingId = row?.ingredient || row?.ingredientId;
            const qtyRaw = row?.quantity;
            if (!mongoose.Types.ObjectId.isValid(ingId)) {
                const err = new Error("VALIDATION_ERROR");
                err.status = 400;
                err.body = { error: "Invalid ingredient id in items" };
                throw err;
            }
            const qty = Number(qtyRaw);
            if (Number.isNaN(qty) || qty <= 0) {
                const err = new Error("VALIDATION_ERROR");
                err.status = 400;
                err.body = { error: "Invalid quantity in items" };
                throw err;
            }
            normalizedItems.push({ ingredient: ingId, quantity: qty });
        }

        const upserted = await Recipe.findOneAndUpdate(
            { product: productId },
            {
                $set: {
                    items: normalizedItems,
                    isActive: true,
                    updatedAt: Date.now(),
                },
                $setOnInsert: {
                    product: productId,
                    createdAt: Date.now(),
                },
            },
            { new: true, upsert: true, runValidators: true }
        ).populate("items.ingredient", "name unit baseUnit displayUnit conversionFactor");

        return upserted;
    },

    async removeByProduct(productId) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Invalid productId" };
            throw err;
        }

        const deleted = await Recipe.findOneAndDelete({ product: productId });
        if (!deleted) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Recipe not found" };
            throw err;
        }

        return { success: true };
    },
};
