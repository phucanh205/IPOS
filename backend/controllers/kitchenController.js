import { kitchenService } from "../services/kitchenService.js";
import { getIO } from "../socket.js";

const respondServiceError = (res, err) => {
    if (err && err.body && err.status) {
        return res.status(err.status).json(err.body);
    }
    return res.status(500).json({ error: err?.message || "Internal server error" });
};

export const kitchenController = {
    async receivingTasks(req, res) {
        try {
            const result = await kitchenService.getReceivingTasks({ date: req.query?.date });
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async receivingConfirm(req, res) {
        try {
            const result = await kitchenService.confirmReceiving({
                items: req.body?.items,
                user: req.user,
            });
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async orders(req, res) {
        try {
            const { kitchenStatus, status, limit } = req.query || {};
            const result = await kitchenService.listOrders({
                kitchenStatus,
                status,
                limit,
                date: req.query?.date,
            });
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async updateKitchenStatus(req, res) {
        try {
            const { kitchenStatus, rejectionReason } = req.body || {};
            const populatedOrder = await kitchenService.updateKitchenStatus(req.params.id, {
                kitchenStatus,
                rejectionReason,
                user: req.user,
            });

            try {
                const io = getIO();
                io.to("cashier").emit("order-status-updated", populatedOrder);
                io.to("kitchen").emit("order-status-updated", populatedOrder);
            } catch {
                // ignore
            }

            return res.json(populatedOrder);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },
};
