import express from "express";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: "Username and password are required",
                code: "VALIDATION_ERROR",
            });
        }

        const user = await User.findOne({ username: String(username).toLowerCase() });
        if (!user) {
            return res.status(401).json({
                error: "Invalid credentials",
                code: "INVALID_CREDENTIALS",
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                error: "Invalid credentials",
                code: "INVALID_CREDENTIALS",
            });
        }

        const token = generateToken(user);

        return res.json({
            token,
            user: {
                userID: user.userID,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get("/me", authenticate, async (req, res) => {
    return res.json({ user: req.user });
});

router.post("/logout", authenticate, async (req, res) => {
    return res.json({ message: "Logged out" });
});

export default router;
