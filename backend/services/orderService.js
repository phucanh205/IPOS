import mongoose from "mongoose";
import Order from "../models/Order.js";
import Ingredient from "../models/Ingredient.js";
import Recipe from "../models/Recipe.js";

const safeNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};

const buildIngredientRequirementsFromItems = async (items, session) => {
    const list = Array.isArray(items) ? items : [];
    const productIds = list
        .map((it) => it?.productId)
        .filter(Boolean)
        .map((id) => String(id));

    if (!productIds.length) {
        return { requiredItems: [], shortages: [], missingRecipes: [] };
    }

    let recipeQuery = Recipe.find({ product: { $in: productIds }, isActive: true });
    if (session) recipeQuery = recipeQuery.session(session);
    const recipes = await recipeQuery;
    const recipeByProductId = new Map(recipes.map((r) => [String(r.product), r]));

    const missingRecipes = [];
    for (const it of list) {
        const pid = it?.productId ? String(it.productId) : "";
        if (!pid) continue;
        if (!recipeByProductId.has(pid)) {
            missingRecipes.push({
                productId: pid,
                productName: String(it?.productName || "").trim(),
            });
        }
    }

    const requiredByIngredientId = new Map();
    for (const it of list) {
        const pid = it?.productId ? String(it.productId) : "";
        if (!pid) continue;
        const recipe = recipeByProductId.get(pid);
        if (!recipe) continue;

        const itemQty = safeNumber(it?.quantity, 0);
        if (!itemQty || itemQty <= 0) continue;

        const recipeItems = Array.isArray(recipe?.items) ? recipe.items : [];
        for (const ri of recipeItems) {
            const ingId = ri?.ingredient ? String(ri.ingredient) : "";
            if (!ingId) continue;
            const perProduct = safeNumber(ri?.quantity, 0);
            if (!perProduct || perProduct <= 0) continue;
            const need = perProduct * itemQty;
            requiredByIngredientId.set(
                ingId,
                safeNumber(requiredByIngredientId.get(ingId), 0) + need
            );
        }
    }

    const ingIds = [...requiredByIngredientId.keys()];
    if (!ingIds.length) {
        return { requiredItems: [], shortages: [], missingRecipes };
    }

    let ingQuery = Ingredient.find({ _id: { $in: ingIds } }).select("name stockOnHand baseUnit");
    if (session) ingQuery = ingQuery.session(session);
    const ingredients = await ingQuery;
    const ingById = new Map(ingredients.map((i) => [String(i._id), i]));

    const requiredItems = ingIds.map((id) => ({
        ingredientId: id,
        quantity: safeNumber(requiredByIngredientId.get(id), 0),
    }));

    const shortages = [];
    for (const reqItem of requiredItems) {
        const ing = ingById.get(String(reqItem.ingredientId));
        const available = safeNumber(ing?.stockOnHand, 0);
        const required = safeNumber(reqItem?.quantity, 0);
        if (required > available) {
            shortages.push({
                ingredientId: String(reqItem.ingredientId),
                ingredientName: String(ing?.name || "").trim(),
                baseUnit: String(ing?.baseUnit || "").trim(),
                required,
                available,
                shortage: required - available,
            });
        }
    }

    return { requiredItems, shortages, missingRecipes };
};

const applyDeduction = async ({ requiredItems, session }) => {
    const deducted = [];
    for (const reqItem of requiredItems) {
        const qty = safeNumber(reqItem?.quantity, 0);
        if (!qty || qty <= 0) continue;

        const filter = {
            _id: reqItem.ingredientId,
            stockOnHand: { $gte: qty },
        };
        const update = { $inc: { stockOnHand: -qty } };

        let q = Ingredient.updateOne(filter, update);
        if (session) q = q.session(session);
        const r = await q;
        if (!r?.modifiedCount) {
            const rollbackOps = deducted.map((d) => {
                let rq = Ingredient.updateOne({ _id: d.ingredientId }, { $inc: { stockOnHand: d.quantity } });
                if (session) rq = rq.session(session);
                return rq;
            });
            await Promise.all(rollbackOps);
            const err = new Error("INSUFFICIENT_INGREDIENTS");
            err.code = "INSUFFICIENT_INGREDIENTS";
            throw err;
        }

        deducted.push({ ingredientId: reqItem.ingredientId, quantity: qty });
    }

    return deducted;
};

const isTransactionNotSupportedError = (e) => {
    const msg = String(e?.message || "");
    return (
        msg.includes("Transaction numbers are only allowed on a replica set member or mongos") ||
        msg.toLowerCase().includes("replica set") ||
        msg.toLowerCase().includes("mongos")
    );
};

const buildRecipeMissingError = (missingRecipes) => {
    const err = new Error("RECIPE_MISSING");
    err.status = 409;
    err.body = {
        error: "Missing recipe for product",
        code: "RECIPE_MISSING",
        missingRecipes: Array.isArray(missingRecipes) ? missingRecipes : [],
    };
    return err;
};

const buildInsufficientError = (shortages) => {
    const err = new Error("INSUFFICIENT_INGREDIENTS");
    err.status = 409;
    err.body = {
        error: "Insufficient ingredients",
        code: "INSUFFICIENT_INGREDIENTS",
        shortages: Array.isArray(shortages) ? shortages : [],
    };
    return err;
};

export const orderService = {
    async list({ search, status, startDate, endDate } = {}) {
        const query = {};

        if (search) {
            const searchNumber = parseFloat(search);
            const isNumber = !isNaN(searchNumber);

            query.$or = [
                { orderNumber: { $regex: search, $options: "i" } },
                { tableNumber: { $regex: search, $options: "i" } },
            ];

            if (isNumber) {
                query.$or.push({ total: searchNumber });
            }
        }

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate + "T00:00:00.000Z");
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate + "T23:59:59.999Z");
            }
        }

        const orders = await Order.find(query)
            .populate("items.productId", "name image")
            .sort({ createdAt: -1 });

        return orders;
    },

    async getById(id) {
        const order = await Order.findById(id).populate("items.productId", "name image price");
        if (!order) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Order not found" };
            throw err;
        }
        return order;
    },

    async create(payload = {}) {
        const {
            tableNumber,
            orderType,
            paymentMethod,
            items,
            subtotal,
            tax,
            total,
            totalPaid,
            changeDue,
        } = payload;

        if (!items || items.length === 0) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Order must have at least one item" };
            throw err;
        }

        const count = await Order.countDocuments();
        const orderNumber = `#${String(count + 1).padStart(4, "0")}`;

        const order = new Order({
            orderNumber,
            tableNumber: tableNumber || "Table 1",
            orderType: orderType || "Dine in",
            paymentMethod: paymentMethod || "Cash",
            items: items.map((item) => {
                const product = item.product || {};
                return {
                    productId: item.productId || product._id,
                    productName: item.productName || product.name,
                    quantity: item.quantity,
                    price: item.price || product.price || 0,
                    totalPrice: item.totalPrice || item.quantity * (item.price || product.price || 0),
                    size: item.size,
                    sizeLabel: item.sizeLabel,
                    toppings: item.toppings || [],
                    notes: item.notes || "",
                };
            }),
            subtotal: subtotal || 0,
            tax: tax || 0,
            total: total || 0,
            totalPaid: totalPaid || total || 0,
            changeDue: changeDue || 0,
            status: "awaiting_kitchen",
            kitchenStatus: "new",
            sentToKitchenAt: new Date(),
        });

        let session;
        let usedTransaction = false;

        try {
            session = await mongoose.startSession();
            usedTransaction = true;
            await session.withTransaction(async () => {
                const { requiredItems, shortages, missingRecipes } =
                    await buildIngredientRequirementsFromItems(order.items, session);

                if (missingRecipes.length) {
                    const err = new Error("RECIPE_MISSING");
                    err.code = "RECIPE_MISSING";
                    err.payload = { missingRecipes };
                    throw err;
                }

                if (shortages.length) {
                    const err = new Error("INSUFFICIENT_INGREDIENTS");
                    err.code = "INSUFFICIENT_INGREDIENTS";
                    err.payload = { shortages };
                    throw err;
                }

                await applyDeduction({ requiredItems, session });

                order.ingredientsDeductedAt = new Date();
                order.ingredientsDeductedBy = "";
                order.ingredientsDeductedItems = requiredItems
                    .filter((x) => safeNumber(x?.quantity, 0) > 0)
                    .map((x) => ({
                        ingredient: x.ingredientId,
                        quantity: safeNumber(x?.quantity, 0),
                    }));
                order.ingredientsRestockedAt = null;
                order.ingredientsRestockedBy = "";

                await order.save({ session });
            });
        } catch (e) {
            if (usedTransaction && isTransactionNotSupportedError(e)) {
                const { requiredItems, shortages, missingRecipes } =
                    await buildIngredientRequirementsFromItems(order.items, null);

                if (missingRecipes.length) {
                    throw buildRecipeMissingError(missingRecipes);
                }

                if (shortages.length) {
                    throw buildInsufficientError(shortages);
                }

                try {
                    await applyDeduction({ requiredItems, session: null });
                } catch (e2) {
                    if (String(e2?.code || "") === "INSUFFICIENT_INGREDIENTS") {
                        const { shortages: nextShortages } =
                            await buildIngredientRequirementsFromItems(order.items, null);
                        throw buildInsufficientError(nextShortages);
                    }
                    throw e2;
                }

                order.ingredientsDeductedAt = new Date();
                order.ingredientsDeductedBy = "";
                order.ingredientsDeductedItems = requiredItems
                    .filter((x) => safeNumber(x?.quantity, 0) > 0)
                    .map((x) => ({
                        ingredient: x.ingredientId,
                        quantity: safeNumber(x?.quantity, 0),
                    }));
                order.ingredientsRestockedAt = null;
                order.ingredientsRestockedBy = "";

                await order.save();
            } else {
                if (String(e?.code || "") === "RECIPE_MISSING") {
                    throw buildRecipeMissingError(e?.payload?.missingRecipes);
                }

                if (String(e?.code || "") === "INSUFFICIENT_INGREDIENTS") {
                    throw buildInsufficientError(e?.payload?.shortages);
                }

                throw e;
            }
        } finally {
            if (session) {
                try {
                    await session.endSession();
                } catch {
                    // ignore
                }
            }
        }

        const populatedOrder = await Order.findById(order._id).populate("items.productId", "name image");
        return populatedOrder;
    },
};
