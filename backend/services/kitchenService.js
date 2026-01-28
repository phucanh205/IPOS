import mongoose from "mongoose";
import Order from "../models/Order.js";
import Ingredient from "../models/Ingredient.js";
import ReceivingLog from "../models/ReceivingLog.js";
import Recipe from "../models/Recipe.js";
import LowStockAlert from "../models/LowStockAlert.js";

const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};

const endOfDay = (d) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
};

const safeNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};

const toDisplayQty = (baseQty, factor) => {
    const f = safeNumber(factor, 1);
    if (f <= 0) return safeNumber(baseQty, 0);
    return safeNumber(baseQty, 0) / f;
};

const addDays = (d, days) => {
    const x = new Date(d);
    x.setDate(x.getDate() + Number(days || 0));
    return x;
};

const isCycleDueOrOverdue = (ing, todayStart) => {
    const cycleDays = safeNumber(ing?.cycleDays, 0);
    if (!cycleDays || cycleDays <= 0) return false;
    const refRaw = ing?.lastReceivedAt || ing?.createdAt;
    const refDate = refRaw ? new Date(refRaw) : null;
    if (!refDate || Number.isNaN(refDate.getTime())) return false;

    const dueStart = addDays(startOfDay(refDate), cycleDays);
    return todayStart.getTime() >= dueStart.getTime();
};

const getActorName = (user) => {
    const u = user || {};
    return String(u?.username || u?.userID || u?.userId || "").trim();
};

const buildIngredientRequirements = async (order, session) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    const productIds = items
        .map((it) => it?.productId)
        .filter(Boolean)
        .map((id) => String(id));

    if (!productIds.length) {
        return {
            requiredItems: [],
            shortages: [],
            missingRecipes: [],
        };
    }

    let recipeQuery = Recipe.find({ product: { $in: productIds }, isActive: true });
    if (session) recipeQuery = recipeQuery.session(session);
    const recipes = await recipeQuery;
    const recipeByProductId = new Map(recipes.map((r) => [String(r.product), r]));

    const missingRecipes = [];
    for (const it of items) {
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
    for (const it of items) {
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
        return {
            requiredItems: [],
            shortages: [],
            missingRecipes,
        };
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

export const kitchenService = {
    async getReceivingTasks({ date } = {}) {
        const dateParam = String(date || "").trim();
        const baseDate = dateParam ? new Date(dateParam) : new Date();
        const todayStart = startOfDay(baseDate);
        const todayEnd = endOfDay(baseDate);

        const receivingSessions = await ReceivingLog.find({
            receivedAt: { $gte: todayStart, $lte: todayEnd },
        }).select("items");

        const receivedTodaySet = new Set();
        for (const s of receivingSessions) {
            const items = Array.isArray(s?.items) ? s.items : [];
            for (const it of items) {
                const ingId = String(it?.ingredientId || "").trim();
                if (ingId) {
                    receivedTodaySet.add(ingId);
                }
            }
        }

        const ingredients = await Ingredient.find({}).sort({ name: 1 });

        const reportedAlerts = await LowStockAlert.find({ status: "reported" }).select(
            "ingredientId status"
        );
        const reportedSet = new Set(
            (Array.isArray(reportedAlerts) ? reportedAlerts : []).map((a) =>
                String(a?.ingredientId)
            )
        );

        const daily = [];
        const other = [];

        for (const ing of ingredients) {
            if (receivedTodaySet.has(String(ing?._id))) {
                continue;
            }

            const rule = String(ing?.issueRule || "").trim();
            const displayUnit = String(ing?.displayUnit || ing?.unit || "").trim();
            const factor = safeNumber(ing?.conversionFactor, 1);
            const stockDisplay = toDisplayQty(ing?.stockOnHand, factor);
            const parDisplay =
                ing?.parLevel === null || ing?.parLevel === undefined
                    ? null
                    : toDisplayQty(ing.parLevel, factor);
            const minDisplay =
                ing?.minStockLevel === null || ing?.minStockLevel === undefined
                    ? null
                    : toDisplayQty(ing.minStockLevel, factor);

            const suggestedQty = parDisplay ?? stockDisplay ?? 0;

            if (rule === "daily") {
                daily.push({
                    _id: ing._id,
                    name: ing.name,
                    issueRule: rule,
                    displayUnit,
                    suggestedQty,
                    currentQty: stockDisplay,
                });
                continue;
            }

            if (rule === "cycle") {
                const nextDate = ing?.nextReceiveDate ? new Date(ing.nextReceiveDate) : null;
                const hasNextDate = nextDate && !Number.isNaN(nextDate.getTime());
                const dueByNextDate = hasNextDate && nextDate.getTime() <= todayEnd.getTime();
                const dueByCycle = !hasNextDate && isCycleDueOrOverdue(ing, todayStart);

                if (dueByNextDate || dueByCycle) {
                    other.push({
                        _id: ing._id,
                        name: ing.name,
                        issueRule: rule,
                        displayUnit,
                        suggestedQty,
                        currentQty: stockDisplay,
                        reason: "cycle",
                    });
                }
                continue;
            }

            if (rule === "long_storage") {
                const min = minDisplay ?? (parDisplay ?? stockDisplay) / 2;
                const threshold =
                    parDisplay !== null && parDisplay !== undefined && parDisplay > 0
                        ? parDisplay * 0.1
                        : min > 0
                        ? min * 0.1
                        : 0;
                const isReported = reportedSet.has(String(ing?._id));
                if (isReported && threshold > 0 && stockDisplay < threshold) {
                    other.push({
                        _id: ing._id,
                        name: ing.name,
                        issueRule: rule,
                        displayUnit,
                        suggestedQty,
                        currentQty: stockDisplay,
                        reason: "low_stock",
                        minQty: threshold,
                        alertStatus: "reported",
                    });
                }
            }
        }

        return {
            date: todayStart.toISOString().slice(0, 10),
            daily,
            other,
        };
    },

    async confirmReceiving({ items, user }) {
        if (!Array.isArray(items) || items.length === 0) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Items are required" };
            throw err;
        }

        const now = new Date();
        const todayStart = startOfDay(now);

        const updates = [];
        const logItems = [];

        for (const it of items) {
            const ingredientId = it?.ingredientId;
            const receivedQtyRaw = it?.receivedQty;
            const suggestedQtyRaw = it?.suggestedQty;
            const noteRaw = it?.note;

            if (!ingredientId) continue;
            if (receivedQtyRaw === undefined || receivedQtyRaw === null || receivedQtyRaw === "") continue;

            const receivedDisplay = Number(receivedQtyRaw);
            if (!Number.isFinite(receivedDisplay) || receivedDisplay < 0) continue;

            const ing = await Ingredient.findById(ingredientId);
            if (!ing) continue;

            const factor = safeNumber(ing?.conversionFactor, 1);
            const receivedBase = receivedDisplay * (factor > 0 ? factor : 1);

            const displayUnit = String(ing?.displayUnit || ing?.unit || "").trim();
            const suggestedDisplay =
                suggestedQtyRaw === undefined || suggestedQtyRaw === null || suggestedQtyRaw === ""
                    ? null
                    : Number(suggestedQtyRaw);
            const note = String(noteRaw || "").trim();

            ing.stockOnHand = safeNumber(ing.stockOnHand, 0) + receivedBase;

            const rule = String(ing?.issueRule || "").trim();
            if (rule === "cycle") {
                ing.lastReceivedAt = now;
                const cycleDays = safeNumber(ing?.cycleDays, 0);
                if (cycleDays > 0) {
                    ing.nextReceiveDate = addDays(todayStart, cycleDays);
                } else {
                    ing.nextReceiveDate = null;
                }
            }

            await ing.save();
            updates.push({ _id: ing._id, stockOnHand: ing.stockOnHand });

            logItems.push({
                ingredientId: ing._id,
                ingredientName: ing.name,
                displayUnit,
                suggestedQty: Number.isFinite(suggestedDisplay) ? suggestedDisplay : null,
                receivedQty: receivedDisplay,
                note,
            });

            // if this ingredient has a reported alert, mark checked
            try {
                await LowStockAlert.findOneAndUpdate(
                    { ingredientId: ing._id, status: "reported" },
                    {
                        $set: {
                            status: "checked",
                            checkedAt: now,
                            checkedBy: {
                                userID: user?.userID || "",
                                username: user?.username || "",
                                role: user?.role || "",
                            },
                            lastSeenAt: now,
                        },
                    },
                    { new: true }
                );
            } catch {
                // ignore
            }
        }

        if (logItems.length > 0) {
            const dateKey = todayStart.toISOString().slice(0, 10);
            try {
                await ReceivingLog.create({
                    dateKey,
                    receivedAt: now,
                    createdBy: {
                        userID: user?.userID || "",
                        username: user?.username || "",
                        role: user?.role || "",
                    },
                    items: logItems,
                });
            } catch {
                // ignore
            }
        }

        return { success: true, updated: updates.length };
    },

    async listOrders({ kitchenStatus, status, limit = 50, date } = {}) {
        const dateParam = String(date || "").trim();
        const baseDate = dateParam ? new Date(dateParam) : new Date();
        const todayStart = startOfDay(baseDate);
        const todayEnd = endOfDay(baseDate);

        const query = {};
        if (kitchenStatus) query.kitchenStatus = kitchenStatus;
        if (status) query.status = status;

        const isRejectedFilter = String(kitchenStatus || "").trim() === "rejected";
        const isKitchenRejectedStatus = String(status || "").trim() === "kitchen_rejected";

        if (isRejectedFilter || isKitchenRejectedStatus) {
            query.kitchenRejectedAt = { $gte: todayStart, $lte: todayEnd };
        } else if (!kitchenStatus && !status) {
            query.$or = [
                { kitchenStatus: { $ne: "rejected" } },
                {
                    kitchenStatus: "rejected",
                    kitchenRejectedAt: { $gte: todayStart, $lte: todayEnd },
                },
            ];
        }

        const orders = await Order.find(query)
            .populate("items.productId", "name image")
            .sort({ sentToKitchenAt: -1, createdAt: -1 })
            .limit(Math.min(Number(limit) || 50, 200));

        return orders;
    },

    async updateKitchenStatus(orderId, { kitchenStatus, rejectionReason, user }) {
        const allowed = ["new", "accepted", "cooking", "completed", "rejected"];

        if (!allowed.includes(kitchenStatus)) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Invalid kitchenStatus", allowed };
            throw err;
        }

        const order = await Order.findById(orderId);
        if (!order) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Order not found" };
            throw err;
        }

        const actorName = getActorName(user);
        order.kitchenStatus = kitchenStatus;

        if (kitchenStatus === "accepted") {
            const needsDeduct =
                !order.ingredientsDeductedAt ||
                (order.ingredientsDeductedAt && order.ingredientsRestockedAt);

            if (needsDeduct) {
                const doDeduct = async (session) => {
                    const { requiredItems, shortages, missingRecipes } =
                        await buildIngredientRequirements(order, session);

                    if (missingRecipes.length) {
                        const err = new Error("RECIPE_MISSING");
                        err.status = 409;
                        err.body = {
                            error: "Missing recipe for product",
                            code: "RECIPE_MISSING",
                            missingRecipes,
                        };
                        throw err;
                    }

                    if (shortages.length) {
                        const err = new Error("INSUFFICIENT_INGREDIENTS");
                        err.status = 409;
                        err.body = {
                            error: "Insufficient ingredients",
                            code: "INSUFFICIENT_INGREDIENTS",
                            shortages,
                        };
                        throw err;
                    }

                    await applyDeduction({ requiredItems, session });

                    order.ingredientsDeductedAt = new Date();
                    order.ingredientsDeductedBy = actorName;
                    order.ingredientsDeductedItems = requiredItems
                        .filter((x) => safeNumber(x?.quantity, 0) > 0)
                        .map((x) => ({
                            ingredient: x.ingredientId,
                            quantity: safeNumber(x?.quantity, 0),
                        }));
                    order.ingredientsRestockedAt = null;
                    order.ingredientsRestockedBy = "";
                };

                let session;
                try {
                    session = await mongoose.startSession();
                    await session.withTransaction(async () => {
                        await doDeduct(session);
                    });
                } catch (e) {
                    if (session) {
                        try {
                            await session.endSession();
                        } catch {
                            // ignore
                        }
                    }

                    if (e && e.body && e.status) {
                        throw e;
                    }

                    if (String(e?.code || "") === "INSUFFICIENT_INGREDIENTS") {
                        const { shortages } = await buildIngredientRequirements(order, null);
                        const err = new Error("INSUFFICIENT_INGREDIENTS");
                        err.status = 409;
                        err.body = {
                            error: "Insufficient ingredients",
                            code: "INSUFFICIENT_INGREDIENTS",
                            shortages,
                        };
                        throw err;
                    }

                    await doDeduct(null);
                } finally {
                    if (session) {
                        try {
                            await session.endSession();
                        } catch {
                            // ignore
                        }
                    }
                }
            }

            order.status = "in_progress";
            if (!order.kitchenAcceptedAt) {
                order.kitchenAcceptedAt = new Date();
            }
        }

        if (kitchenStatus === "cooking") {
            order.status = "in_progress";
            order.kitchenStartedAt = new Date();
        }

        if (kitchenStatus === "completed") {
            order.status = "completed";
            order.kitchenCompletedAt = new Date();
        }

        if (kitchenStatus === "rejected") {
            order.status = "kitchen_rejected";
            order.kitchenRejectedAt = new Date();
            order.kitchenRejectionReason = rejectionReason || "";

            const hasDeducted =
                !!order.ingredientsDeductedAt &&
                !order.ingredientsRestockedAt &&
                Array.isArray(order.ingredientsDeductedItems) &&
                order.ingredientsDeductedItems.length;

            if (hasDeducted) {
                const restockItems = order.ingredientsDeductedItems
                    .map((x) => ({
                        ingredientId: x?.ingredient,
                        quantity: safeNumber(x?.quantity, 0),
                    }))
                    .filter((x) => x.ingredientId && x.quantity > 0);

                const ops = restockItems.map((x) =>
                    Ingredient.updateOne(
                        { _id: x.ingredientId },
                        { $inc: { stockOnHand: x.quantity } }
                    )
                );
                await Promise.all(ops);

                order.ingredientsRestockedAt = new Date();
                order.ingredientsRestockedBy = actorName;
            }
        }

        await order.save();

        const populatedOrder = await Order.findById(order._id).populate(
            "items.productId",
            "name image"
        );

        return populatedOrder;
    },
};
