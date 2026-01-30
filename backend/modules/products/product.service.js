import Product from "./product.model.js";
import Recipe from "../recipes/recipe.model.js";
import Ingredient from "../ingredients/ingredient.model.js";
import Category from "../categories/category.model.js";

const safeNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};

const normalizeId = (v) => {
    if (!v) return "";
    return String(v?._id || v).trim();
};

export const productService = {
    async list({ category, search }) {
        const query = {};

        // Filter by category (can be ID or slug)
        if (category && category !== "all") {
            const categoryDoc = await Category.findOne({
                $or: [{ _id: category }, { slug: category }],
            });

            if (categoryDoc) {
                query.category = categoryDoc._id;
            }
        }

        // Search by name or barcode
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { barcode: { $regex: search, $options: "i" } },
            ];
        }

        const products = await Product.find(query)
            .populate("category", "name slug")
            .sort({ createdAt: -1 });

        return products;
    },

    async availability({ productIds, cartItems }) {
        const productIdsRaw = Array.isArray(productIds) ? productIds : [];
        const cartItemsRaw = Array.isArray(cartItems) ? cartItems : [];

        const requestedIds = productIdsRaw.map(normalizeId).filter(Boolean);

        const cartQtyByProductId = new Map();
        for (const it of cartItemsRaw) {
            const pid = normalizeId(it?.productId || it?.product);
            const qty = safeNumber(it?.quantity, 0);
            if (!pid || qty <= 0) continue;
            cartQtyByProductId.set(pid, safeNumber(cartQtyByProductId.get(pid), 0) + qty);
        }

        const allProductIdsSet = new Set([
            ...requestedIds,
            ...Array.from(cartQtyByProductId.keys()),
        ]);
        const allProductIds = Array.from(allProductIdsSet).filter(Boolean);

        if (!allProductIds.length) {
            return { items: [] };
        }

        const recipes = await Recipe.find({
            product: { $in: allProductIds },
            isActive: true,
        });
        const recipeByProductId = new Map(recipes.map((r) => [String(r.product), r]));

        const ingredientIdsSet = new Set();
        for (const r of recipes) {
            const items = Array.isArray(r?.items) ? r.items : [];
            for (const ri of items) {
                const ingId = normalizeId(ri?.ingredient);
                if (ingId) ingredientIdsSet.add(ingId);
            }
        }
        const ingredientIds = Array.from(ingredientIdsSet);

        const ingredients = ingredientIds.length
            ? await Ingredient.find({ _id: { $in: ingredientIds } })
            : [];
        const ingredientById = new Map(ingredients.map((i) => [String(i._id), i]));

        const baseRequiredByIngredientId = new Map();
        for (const [pid, qty] of cartQtyByProductId.entries()) {
            const recipe = recipeByProductId.get(pid);
            if (!recipe) continue;
            const items = Array.isArray(recipe?.items) ? recipe.items : [];
            for (const ri of items) {
                const ingId = normalizeId(ri?.ingredient);
                if (!ingId) continue;
                const perUnit = safeNumber(ri?.quantity, 0);
                if (perUnit <= 0) continue;
                baseRequiredByIngredientId.set(
                    ingId,
                    safeNumber(baseRequiredByIngredientId.get(ingId), 0) + perUnit * qty
                );
            }
        }

        const targets = requestedIds.length ? requestedIds : allProductIds;

        const items = targets.map((pid) => {
            const recipe = recipeByProductId.get(pid);
            if (!recipe) {
                return {
                    productId: pid,
                    canAdd: false,
                    reason: "RECIPE_MISSING",
                    shortages: [],
                };
            }

            const addRequiredByIngredientId = new Map();
            const recipeItems = Array.isArray(recipe?.items) ? recipe.items : [];
            for (const ri of recipeItems) {
                const ingId = normalizeId(ri?.ingredient);
                if (!ingId) continue;
                const perUnit = safeNumber(ri?.quantity, 0);
                if (perUnit <= 0) continue;
                addRequiredByIngredientId.set(
                    ingId,
                    safeNumber(addRequiredByIngredientId.get(ingId), 0) + perUnit
                );
            }

            const unionIdsSet = new Set([
                ...Array.from(baseRequiredByIngredientId.keys()),
                ...Array.from(addRequiredByIngredientId.keys()),
            ]);

            const shortages = [];
            for (const ingId of unionIdsSet) {
                const ing = ingredientById.get(ingId);
                const have = safeNumber(ing?.stockOnHand, 0);
                const needBase = safeNumber(baseRequiredByIngredientId.get(ingId), 0);
                const needAdd = safeNumber(addRequiredByIngredientId.get(ingId), 0);
                const need = needBase + needAdd;
                const shortage = need > have ? need - have : 0;
                if (shortage > 0) {
                    shortages.push({
                        ingredientId: ingId,
                        ingredientName: String(ing?.name || "").trim(),
                        baseUnit: String(ing?.baseUnit || "").trim(),
                        have,
                        need,
                        shortage,
                    });
                }
            }

            if (shortages.length) {
                return {
                    productId: pid,
                    canAdd: false,
                    reason: "INSUFFICIENT_INGREDIENTS",
                    shortages,
                };
            }

            return {
                productId: pid,
                canAdd: true,
                reason: null,
                shortages: [],
            };
        });

        return { items };
    },

    async create({ name, description, price, image, categoryId, barcode, tags, showOnPos }) {
        if (!name || !price || !categoryId) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Thiếu thông tin bắt buộc: name, price, categoryId" };
            throw err;
        }

        const product = new Product({
            name,
            description,
            price: Number(price),
            image: image || "https://via.placeholder.com/200",
            category: categoryId,
            barcode,
            inStock: true,
        });

        const savedProduct = await product.save();
        const populatedProduct = await Product.findById(savedProduct._id).populate(
            "category",
            "name slug"
        );

        return populatedProduct;
    },

    async update(id, { name, description, price, image, categoryId, barcode, tags, showOnPos }) {
        const updateData = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = Number(price);
        if (image) updateData.image = image;
        if (categoryId) updateData.category = categoryId;
        if (barcode !== undefined) updateData.barcode = barcode;

        const product = await Product.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate("category", "name slug");

        if (!product) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Product not found" };
            throw err;
        }

        return product;
    },

    async remove(id) {
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Product not found" };
            throw err;
        }
        return { message: "Product deleted successfully" };
    },

    async getById(id) {
        const product = await Product.findById(id).populate("category", "name slug");
        if (!product) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Product not found" };
            throw err;
        }
        return product;
    },
};
