import express from "express";
import Order from "../models/Order.js";
import Ingredient from "../models/Ingredient.js";
import ReceivingLog from "../models/ReceivingLog.js";
import { getIO } from "../socket.js";

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

router.get("/receiving-tasks", async (req, res) => {
    try {
        const dateParam = String(req.query?.date || "").trim();
        const baseDate = dateParam ? new Date(dateParam) : new Date();
        const todayStart = startOfDay(baseDate);
        const todayEnd = endOfDay(baseDate);

        const ingredients = await Ingredient.find({}).sort({ name: 1 });

        const daily = [];
        const other = [];

        for (const ing of ingredients) {
            const rule = String(ing?.issueRule || "").trim();
            const displayUnit = String(ing?.displayUnit || ing?.unit || "").trim();
            const factor = safeNumber(ing?.conversionFactor, 1);
            const stockDisplay = toDisplayQty(ing?.stockOnHand, factor);
            const parDisplay = ing?.parLevel === null || ing?.parLevel === undefined ? null : toDisplayQty(ing.parLevel, factor);
            const minDisplay = ing?.minStockLevel === null || ing?.minStockLevel === undefined ? null : toDisplayQty(ing.minStockLevel, factor);

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
                const min = minDisplay ?? ((parDisplay ?? stockDisplay) / 2);
                if (stockDisplay < min) {
                    other.push({
                        _id: ing._id,
                        name: ing.name,
                        issueRule: rule,
                        displayUnit,
                        suggestedQty,
                        currentQty: stockDisplay,
                        reason: "low_stock",
                        minQty: min,
                    });
                }
            }
        }

        res.json({
            date: todayStart.toISOString().slice(0, 10),
            daily,
            other,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/receiving-confirm", async (req, res) => {
    try {
        const { items } = req.body || {};
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Items are required" });
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
            const suggestedDisplay = suggestedQtyRaw === undefined || suggestedQtyRaw === null || suggestedQtyRaw === "" ? null : Number(suggestedQtyRaw);
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
        }

        if (logItems.length > 0) {
            const dateKey = todayStart.toISOString().slice(0, 10);
            try {
                await ReceivingLog.create({
                    dateKey,
                    receivedAt: now,
                    createdBy: {
                        userID: req.user?.userID || "",
                        username: req.user?.username || "",
                        role: req.user?.role || "",
                    },
                    items: logItems,
                });
            } catch (e) {
                // ignore log write errors
            }
        }

        res.json({ success: true, updated: updates.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/orders", async (req, res) => {
    try {
        const { kitchenStatus, status, limit = 50 } = req.query;

        const dateParam = String(req.query?.date || "").trim();
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

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch("/orders/:id/kitchen-status", async (req, res) => {
    try {
        const { kitchenStatus, rejectionReason } = req.body;
        const allowed = ["new", "accepted", "cooking", "completed", "rejected"];

        if (!allowed.includes(kitchenStatus)) {
            return res.status(400).json({
                error: "Invalid kitchenStatus",
                allowed,
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        order.kitchenStatus = kitchenStatus;

        if (kitchenStatus === "accepted") {
            order.status = "in_progress";
            order.kitchenAcceptedAt = new Date();
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
        }

        await order.save();

        const populatedOrder = await Order.findById(order._id).populate(
            "items.productId",
            "name image"
        );

        try {
            const io = getIO();
            io.to("cashier").emit("order-status-updated", populatedOrder);
            io.to("kitchen").emit("order-status-updated", populatedOrder);
        } catch (e) {
            // ignore if socket not initialized
        }

        res.json(populatedOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
