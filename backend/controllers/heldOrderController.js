import { heldOrderService } from "../services/heldOrderService.js";

const respondServiceError = (res, err) => {
    if (err && err.body && err.status) {
        return res.status(err.status).json(err.body);
    }
    return res.status(500).json({ error: err?.message || "Internal server error" });
};

export const heldOrderController = {
    async list(req, res) {
        try {
            const { search } = req.query || {};
            const orders = await heldOrderService.list({ search });
            return res.json(orders);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async getOne(req, res) {
        try {
            const order = await heldOrderService.getById(req.params.id);
            return res.json(order);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async create(req, res) {
        try {
            const created = await heldOrderService.create(req.body || {});
            return res.status(201).json(created);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async remove(req, res) {
        try {
            const result = await heldOrderService.remove(req.params.id);
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },
};
