import { orderService } from "./order.service.js";
import { getIO } from "../../socket.js";

const respondServiceError = (res, err) => {
    if (err && err.body && err.status) {
        return res.status(err.status).json(err.body);
    }
    return res.status(500).json({ error: err?.message || "Internal server error" });
};

export const orderController = {
    async list(req, res) {
        try {
            const { search, status, startDate, endDate } = req.query || {};
            const orders = await orderService.list({ search, status, startDate, endDate });
            return res.json(orders);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async getOne(req, res) {
        try {
            const order = await orderService.getById(req.params.id);
            return res.json(order);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async create(req, res) {
        try {
            const created = await orderService.create(req.body || {});

            try {
                const io = getIO();
                io.to("kitchen").emit("new-order", created);
            } catch {
                // ignore if socket not initialized
            }

            return res.status(201).json(created);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },
};
