import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";

export const authService = {
    async login({ username, password }) {
        if (!username || !password) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = {
                error: "Username and password are required",
                code: "VALIDATION_ERROR",
            };
            throw err;
        }

        const user = await User.findOne({ username: String(username).toLowerCase() });
        if (!user) {
            const err = new Error("INVALID_CREDENTIALS");
            err.status = 401;
            err.body = {
                error: "Invalid credentials",
                code: "INVALID_CREDENTIALS",
            };
            throw err;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            const err = new Error("INVALID_CREDENTIALS");
            err.status = 401;
            err.body = {
                error: "Invalid credentials",
                code: "INVALID_CREDENTIALS",
            };
            throw err;
        }

        const token = generateToken(user);

        return {
            token,
            user: {
                userID: user.userID,
                username: user.username,
                role: user.role,
            },
        };
    },
};
