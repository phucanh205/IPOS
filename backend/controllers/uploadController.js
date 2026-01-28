import { uploadService } from "../services/uploadService.js";

const respondServiceError = (res, err) => {
    if (err && err.body && err.status) {
        return res.status(err.status).json(err.body);
    }
    return res.status(500).json({ error: err?.message || "Internal server error" });
};

export const uploadController = {
    uploadImage(req, res) {
        try {
            const result = uploadService.uploadSingleImage(req.file);
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },
};
