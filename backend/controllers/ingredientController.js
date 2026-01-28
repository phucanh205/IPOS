import { ingredientService } from "../services/ingredientService.js";

const respondServiceError = (res, err) => {
    if (err && err.body && err.status) {
        return res.status(err.status).json(err.body);
    }
    return res.status(500).json({ error: err?.message || "Internal server error" });
};

export const ingredientController = {
    async list(req, res) {
        try {
            const { search = "" } = req.query || {};
            const ingredients = await ingredientService.list({ search });
            return res.json(ingredients);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async create(req, res) {
        try {
            const created = await ingredientService.create(req.body || {});
            return res.status(201).json(created);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async update(req, res) {
        try {
            const updated = await ingredientService.update(req.params.id, req.body || {});
            return res.json(updated);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async remove(req, res) {
        try {
            const result = await ingredientService.remove(req.params.id);
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },
};
