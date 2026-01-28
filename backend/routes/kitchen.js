import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Ingredient from "../models/Ingredient.js";
import ReceivingLog from "../models/ReceivingLog.js";
import Recipe from "../models/Recipe.js";
import LowStockAlert from "../models/LowStockAlert.js";
import { getIO } from "../socket.js";
import { kitchenController } from "../controllers/kitchenController.js";

const router = express.Router();

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

const isCycleDueOrOverdue = (ing, todayStart) => {
    const cycleDays = safeNumber(ing?.cycleDays, 0);
    if (!cycleDays || cycleDays <= 0) return false;
    const refRaw = ing?.lastReceivedAt || ing?.createdAt;
    const refDate = refRaw ? new Date(refRaw) : null;
    if (!refDate || Number.isNaN(refDate.getTime())) return false;

    const dueStart = addDays(startOfDay(refDate), cycleDays);
    return todayStart.getTime() >= dueStart.getTime();
};

const addDays = (d, days) => {
    const x = new Date(d);
    x.setDate(x.getDate() + Number(days || 0));
    return x;
};

const getActorName = (req) => {
    const u = req?.user || {};
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
    const recipeByProductId = new Map(
        recipes.map((r) => [String(r.product), r])
    );

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

    let ingQuery = Ingredient.find({ _id: { $in: ingIds } }).select(
        "name stockOnHand baseUnit"
    );
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
                let rq = Ingredient.updateOne(
                    { _id: d.ingredientId },
                    { $inc: { stockOnHand: d.quantity } }
                );
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

router.get("/receiving-tasks", kitchenController.receivingTasks);

router.post("/receiving-confirm", kitchenController.receivingConfirm);

router.get("/orders", kitchenController.orders);

router.patch("/orders/:id/kitchen-status", kitchenController.updateKitchenStatus);

export default router;
