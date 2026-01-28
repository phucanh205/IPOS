import { authService } from "../services/authService.js";

const respondServiceError = (res, err) => {
    if (err && err.body && err.status) {
        return res.status(err.status).json(err.body);
    }
    return res.status(500).json({ error: err?.message || "Internal server error" });
};

export const authController = {
    async login(req, res) {
        try {
            const { username, password } = req.body;
            const payload = await authService.login({ username, password });
            return res.json(payload);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async me(req, res) {
        return res.json({ user: req.user });
    },

    async logout(req, res) {
        return res.json({ message: "Logged out" });
    },
};
