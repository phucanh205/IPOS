import { verifyToken } from "../utils/jwt.js";

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ 
                error: "Access token required",
                code: "TOKEN_MISSING"
            });
        }

        const token = authHeader.substring(7);
        
        try {
            const decoded = verifyToken(token);
            req.user = decoded;
            next();
        } catch (jwtError) {
            return res.status(401).json({ 
                error: "Invalid or expired token",
                code: "TOKEN_INVALID"
            });
        }
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({ 
            error: "Authentication failed",
            code: "AUTH_ERROR"
        });
    }
};

export const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: "Authentication required",
                code: "USER_NOT_FOUND"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: "Insufficient permissions",
                code: "INSUFFICIENT_PERMISSIONS",
                required: allowedRoles,
                current: req.user.role
            });
        }

        next();
    };
};

export const authenticateAndCheckRole = (...allowedRoles) => {
    return [authenticate, checkRole(...allowedRoles)];
};
