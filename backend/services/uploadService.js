export const uploadService = {
    uploadSingleImage(file) {
        if (!file) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Không có file được upload" };
            throw err;
        }

        const fileUrl = `/uploads/${file.filename}`;
        return {
            success: true,
            url: fileUrl,
            filename: file.filename,
        };
    },
};
