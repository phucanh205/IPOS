import { productService } from "./product.service.js";

const respondServiceError = (res, err) => {
    if (err && err.body && err.status) {
        return res.status(err.status).json(err.body);
    }
    return res.status(500).json({ error: err?.message || "Internal server error" });
};

export const productController = {
    async list(req, res) {
        try {
            const { category, search } = req.query || {};
            const products = await productService.list({ category, search });
            return res.json(products);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async availability(req, res) {
        try {
            const productIds = Array.isArray(req.body?.productIds) ? req.body.productIds : [];
            const cartItems = Array.isArray(req.body?.cartItems) ? req.body.cartItems : [];
            const result = await productService.availability({ productIds, cartItems });
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async create(req, res) {
        try {
            const { name, description, price, image, categoryId, barcode, tags, showOnPos } =
                req.body || {};
            const created = await productService.create({
                name,
                description,
                price,
                image,
                categoryId,
                barcode,
                tags,
                showOnPos,
            });
            return res.status(201).json(created);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async update(req, res) {
        try {
            const { name, description, price, image, categoryId, barcode, tags, showOnPos } =
                req.body || {};
            const updated = await productService.update(req.params.id, {
                name,
                description,
                price,
                image,
                categoryId,
                barcode,
                tags,
                showOnPos,
            });
            return res.json(updated);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async remove(req, res) {
        try {
            const result = await productService.remove(req.params.id);
            return res.json(result);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },

    async getOne(req, res) {
        try {
            const product = await productService.getById(req.params.id);
            return res.json(product);
        } catch (err) {
            return respondServiceError(res, err);
        }
    },
};
