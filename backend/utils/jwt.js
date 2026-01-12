import jwt from "jsonwebtoken";

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not set");
    }
    return secret;
};

export const generateToken = (user, options = {}) => {
    const secret = getJwtSecret();

    const payload = {
        userID: user?.userID,
        username: user?.username,
        role: user?.role,
    };

    const expiresIn = options.expiresIn || process.env.JWT_EXPIRES_IN || "7d";

    return jwt.sign(payload, secret, {
        expiresIn,
    });
};

export const verifyToken = (token) => {
    const secret = getJwtSecret();
    return jwt.verify(token, secret);
};
