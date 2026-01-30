import { recipeService } from "./recipe.service.js";

const respondServiceError = (res, err) => {
    if (err && err.body && err.status) {
        return res.status(err.status).json(err.body);
    }
    return res.status(500).json({ error: err?.message || "Internal server error" });
};

export const recipeController = {
    async getByProduct(req, res) {
        try {
            const { productId } = req.params || {};
            const recipe = await recipeService.getByProduct(productId);
            return res.json(recipe);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async setActive(req, res) {
        try {
            const { productId } = req.params || {};
            const { isActive } = req.body || {};
            const updated = await recipeService.setActive(productId, { isActive });
            return res.json(updated);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async upsertByProduct(req, res) {
        try {
            const { productId } = req.params || {};
            const { items } = req.body || {};
            const upserted = await recipeService.upsertByProduct(productId, { items });
            return res.json(upserted);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async removeByProduct(req, res) {
        try {
            const { productId } = req.params || {};
            const result = await recipeService.removeByProduct(productId);
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },
};
