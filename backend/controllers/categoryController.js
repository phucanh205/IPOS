import { categoryService } from "../services/categoryService.js";

const respondServiceError = (res, err) => {
    if (err && err.body && err.status) {
        return res.status(err.status).json(err.body);
    }
    return res.status(500).json({ error: err?.message || "Internal server error" });
};

export const categoryController = {
    async list(req, res) {
        try {
            const categories = await categoryService.list();
            return res.json(categories);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async create(req, res) {
        try {
            const { name } = req.body || {};
            const category = await categoryService.create({ name });
            return res.status(201).json(category);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async getOne(req, res) {
        try {
            const category = await categoryService.getById(req.params.id);
            return res.json(category);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async update(req, res) {
        try {
            const { name } = req.body || {};
            const updated = await categoryService.update(req.params.id, { name });
            return res.json(updated);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async remove(req, res) {
        try {
            const result = await categoryService.remove(req.params.id);
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },
};
