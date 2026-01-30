import { toppingService } from "./topping.service.js";

const respondServiceError = (res, err) => {
    if (err && err.body && err.status) {
        return res.status(err.status).json(err.body);
    }
    return res.status(500).json({ error: err?.message || "Internal server error" });
};

export const toppingController = {
    async list(req, res) {
        try {
            const result = await toppingService.list();
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },
};
