import express from "express";
import Ingredient from "../models/Ingredient.js";
import ReceivingLog from "../models/ReceivingLog.js";
import LowStockAlert from "../models/LowStockAlert.js";

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

router.get("/low-stock", async (req, res) => {
    try {
        const ingredients = await Ingredient.find({
            parLevel: { $ne: null },
        }).sort({ name: 1 });

        const lowStock = [];
        const now = new Date();

        for (const ing of ingredients) {
            const factor = safeNumber(ing?.conversionFactor, 1);
            const stockDisplay = toDisplayQty(ing?.stockOnHand, factor);
            const parDisplay = toDisplayQty(ing?.parLevel, factor);
            const fallbackMinDisplay = toDisplayQty(ing?.minStockLevel, factor);
            const thresholdDisplay =
                parDisplay > 0
                    ? parDisplay * 0.1
                    : fallbackMinDisplay > 0
                    ? fallbackMinDisplay * 0.1
                    : 0;

            if (thresholdDisplay > 0 && stockDisplay < thresholdDisplay) {
                let alert = null;
                try {
                    alert = await LowStockAlert.findOneAndUpdate(
                        { ingredientId: ing._id },
                        {
                            $setOnInsert: {
                                ingredientId: ing._id,
                                firstSeenAt: now,
                                status: "open",
                            },
                            $set: {
                                lastSeenAt: now,
                            },
                        },
                        { new: true, upsert: true }
                    );
                } catch (e) {
                    // ignore alert write errors
                }

                lowStock.push({
                    _id: ing._id,
                    name: ing.name,
                    displayUnit: String(ing?.displayUnit || ing?.unit || "").trim(),
                    stockQty: stockDisplay,
                    minQty: thresholdDisplay,
                    alertStatus: alert?.status || "open",
                    alertUpdatedAt: alert?.lastSeenAt || null,
                });
            }
        }

        res.json({ items: lowStock });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/low-stock/:ingredientId/report", async (req, res) => {
    try {
        const id = req.params.ingredientId;
        const now = new Date();

        const updated = await LowStockAlert.findOneAndUpdate(
            { ingredientId: id },
            {
                $setOnInsert: {
                    ingredientId: id,
                    firstSeenAt: now,
                },
                $set: {
                    status: "reported",
                    reportedAt: now,
                    reportedBy: {
                        userID: req.user?.userID || "",
                        username: req.user?.username || "",
                        role: req.user?.role || "",
                    },
                    lastSeenAt: now,
                },
            },
            { new: true, upsert: true }
        );

        res.json({ success: true, alert: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/low-stock/:ingredientId/checked", async (req, res) => {
    try {
        const id = req.params.ingredientId;
        const now = new Date();

        const updated = await LowStockAlert.findOneAndUpdate(
            { ingredientId: id },
            {
                $setOnInsert: {
                    ingredientId: id,
                    firstSeenAt: now,
                },
                $set: {
                    status: "checked",
                    checkedAt: now,
                    checkedBy: {
                        userID: req.user?.userID || "",
                        username: req.user?.username || "",
                        role: req.user?.role || "",
                    },
                    lastSeenAt: now,
                },
            },
            { new: true, upsert: true }
        );

        res.json({ success: true, alert: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/low-stock/:ingredientId/resolved", async (req, res) => {
    try {
        const id = req.params.ingredientId;
        const now = new Date();

        const updated = await LowStockAlert.findOneAndUpdate(
            { ingredientId: id },
            {
                $setOnInsert: {
                    ingredientId: id,
                    firstSeenAt: now,
                },
                $set: {
                    status: "resolved",
                    resolvedAt: now,
                    lastSeenAt: now,
                },
            },
            { new: true, upsert: true }
        );

        res.json({ success: true, alert: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/summary", async (req, res) => {
    try {
        const dateParam = String(req.query?.date || "").trim();
        const baseDate = dateParam ? new Date(dateParam) : new Date();
        const dayStart = startOfDay(baseDate);
        const dayEnd = endOfDay(baseDate);
        const dateKey = dayStart.toISOString().slice(0, 10);

        const sessions = await ReceivingLog.find({
            receivedAt: { $gte: dayStart, $lte: dayEnd },
        }).sort({ receivedAt: -1 });

        const byIngredient = new Map();

        for (const s of sessions) {
            const items = Array.isArray(s.items) ? s.items : [];
            for (const it of items) {
                const key = String(it.ingredientId);
                const prev = byIngredient.get(key) || {
                    ingredientId: it.ingredientId,
                    ingredientName: it.ingredientName,
                    displayUnit: it.displayUnit,
                    suggestedQty: it.suggestedQty ?? null,
                    receivedTotal: 0,
                    lastReceivedAt: s.receivedAt,
                };

                prev.ingredientName = it.ingredientName || prev.ingredientName;
                prev.displayUnit = it.displayUnit || prev.displayUnit;
                if (it.suggestedQty !== undefined && it.suggestedQty !== null) {
                    prev.suggestedQty = it.suggestedQty;
                }
                prev.receivedTotal += safeNumber(it.receivedQty, 0);
                if (!prev.lastReceivedAt || new Date(s.receivedAt).getTime() > new Date(prev.lastReceivedAt).getTime()) {
                    prev.lastReceivedAt = s.receivedAt;
                }

                byIngredient.set(key, prev);
            }
        }

        const rows = Array.from(byIngredient.values()).sort((a, b) => {
            return String(a.ingredientName || "").localeCompare(String(b.ingredientName || ""), "vi");
        });

        res.json({
            date: dateKey,
            sessions,
            rows,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/logs", async (req, res) => {
    try {
        const daysRaw = req.query?.days;
        const days = Math.min(Math.max(safeNumber(daysRaw, 7), 1), 30);

        const now = new Date();
        const end = endOfDay(now);
        const start = startOfDay(new Date(now.getTime() - (days - 1) * 86400000));

        const sessions = await ReceivingLog.find({
            receivedAt: { $gte: start, $lte: end },
        }).sort({ receivedAt: -1 });

        const byDate = new Map();
        for (const s of sessions) {
            const dateKey = startOfDay(new Date(s.receivedAt)).toISOString().slice(0, 10);
            const prev = byDate.get(dateKey) || {
                date: dateKey,
                sessionsCount: 0,
                itemsCount: 0,
            };
            prev.sessionsCount += 1;
            prev.itemsCount += Array.isArray(s.items) ? s.items.length : 0;
            byDate.set(dateKey, prev);
        }

        const result = Array.from(byDate.values()).sort((a, b) => String(b.date).localeCompare(String(a.date)));
        res.json({ items: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
