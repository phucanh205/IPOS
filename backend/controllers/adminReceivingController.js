import { adminReceivingService } from "../services/adminReceivingService.js";

const respondServiceError = (res, err) => {
    if (err && err.body && err.status) {
        return res.status(err.status).json(err.body);
    }
    return res.status(500).json({ error: err?.message || "Internal server error" });
};

export const adminReceivingController = {
    async lowStock(req, res) {
        try {
            const result = await adminReceivingService.getLowStock();
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async report(req, res) {
        try {
            const result = await adminReceivingService.reportLowStock(req.params.ingredientId, req.user);
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async checked(req, res) {
        try {
            const result = await adminReceivingService.checkLowStock(req.params.ingredientId, req.user);
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async resolved(req, res) {
        try {
            const result = await adminReceivingService.resolveLowStock(req.params.ingredientId);
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async summary(req, res) {
        try {
            const result = await adminReceivingService.getSummary({ date: req.query?.date });
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async logs(req, res) {
        try {
            const result = await adminReceivingService.getLogs({ days: req.query?.days });
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },
};
