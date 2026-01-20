import express from "express";
import Ingredient from "../models/Ingredient.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { search = "" } = req.query || {};

        const filter = {};
        if (String(search).trim()) {
            const q = String(search).trim();
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { group: { $regex: q, $options: "i" } },
                { supplierName: { $regex: q, $options: "i" } },
            ];
        }

        const ingredients = await Ingredient.find(filter).sort({ name: 1 });
        res.json(ingredients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const {
            name,
            group,
            supplierName,
            unit,
            baseUnit,
            displayUnit,
            conversionFactor,
            issueRule,
            stockOnHand,
            cycleDays,
            nextReceiveDate,
        } = req.body || {};

        if (!name || !String(name).trim()) {
            return res.status(400).json({ error: "Ingredient name is required" });
        }
        if (!group || !String(group).trim()) {
            return res.status(400).json({ error: "Ingredient group is required" });
        }
        if (!supplierName || !String(supplierName).trim()) {
            return res.status(400).json({ error: "Supplier name is required" });
        }
        if (!unit) {
            return res.status(400).json({ error: "Unit is required" });
        }

        const factorNum =
            conversionFactor === undefined || conversionFactor === null || conversionFactor === ""
                ? null
                : Number(conversionFactor);
        if (factorNum !== null && (Number.isNaN(factorNum) || factorNum <= 0)) {
            return res
                .status(400)
                .json({ error: "Conversion factor must be a valid number" });
        }
        if (!issueRule) {
            return res.status(400).json({ error: "Issue rule is required" });
        }
        if (stockOnHand === undefined || stockOnHand === null || stockOnHand === "") {
            return res.status(400).json({ error: "Stock quantity is required" });
        }
        const qtyNum = Number(stockOnHand);
        if (Number.isNaN(qtyNum) || qtyNum < 0) {
            return res.status(400).json({ error: "Stock quantity must be a valid number" });
        }

        const derivedDisplayUnit = String(displayUnit || unit || "").trim();
        const derivedFactor =
            factorNum !== null
                ? factorNum
                : String(derivedDisplayUnit).toLowerCase() === "kg"
                ? 1000
                : 1;

        const normalized = {
            name: String(name).trim(),
            group: String(group).trim(),
            supplierName: String(supplierName).trim(),
            unit: String(displayUnit || unit).trim(),
            baseUnit: baseUnit ? String(baseUnit).trim() : undefined,
            displayUnit: displayUnit ? String(displayUnit).trim() : undefined,
            conversionFactor: factorNum === null ? undefined : factorNum,
            issueRule,
            stockOnHand: qtyNum * derivedFactor,
            cycleDays: cycleDays === "" || cycleDays === null || cycleDays === undefined ? null : Number(cycleDays),
            nextReceiveDate: nextReceiveDate ? new Date(nextReceiveDate) : null,
        };

        if (normalized.issueRule === "cycle") {
            const hasCycle = Number.isFinite(normalized.cycleDays) && normalized.cycleDays > 0;
            const hasDate = normalized.nextReceiveDate instanceof Date && !Number.isNaN(normalized.nextReceiveDate.getTime());
            if (!hasCycle && !hasDate) {
                return res.status(400).json({
                    error: "Cycle rule requires cycleDays or nextReceiveDate",
                });
            }
        }

        const created = await Ingredient.create(normalized);
        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const {
            name,
            group,
            supplierName,
            unit,
            baseUnit,
            displayUnit,
            conversionFactor,
            issueRule,
            stockOnHand,
            cycleDays,
            nextReceiveDate,
        } = req.body || {};

        const existing = await Ingredient.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: "Ingredient not found" });
        }

        const update = {};

        const nextName = name !== undefined ? String(name || "").trim() : String(existing.name || "").trim();
        const nextGroup = group !== undefined ? String(group || "").trim() : String(existing.group || "").trim();
        const nextSupplier = supplierName !== undefined ? String(supplierName || "").trim() : String(existing.supplierName || "").trim();
        const nextUnit = unit !== undefined ? unit : existing.unit;
        const nextDisplayUnit =
            displayUnit !== undefined
                ? String(displayUnit || "").trim()
                : String(existing.displayUnit || existing.unit || "").trim();
        const nextBaseUnit =
            baseUnit !== undefined
                ? String(baseUnit || "").trim()
                : String(existing.baseUnit || "").trim();
        const nextFactorRaw =
            conversionFactor !== undefined ? conversionFactor : existing.conversionFactor;
        const nextFactorNum =
            nextFactorRaw === undefined || nextFactorRaw === null || nextFactorRaw === ""
                ? null
                : Number(nextFactorRaw);
        const nextRule = issueRule !== undefined ? issueRule : existing.issueRule;
        const nextQtyRaw = stockOnHand !== undefined ? stockOnHand : existing.stockOnHand;
        const nextQtyNum = Number(nextQtyRaw);

        if (!nextName) {
            return res.status(400).json({ error: "Ingredient name is required" });
        }
        if (!nextGroup) {
            return res.status(400).json({ error: "Ingredient group is required" });
        }
        if (!nextSupplier) {
            return res.status(400).json({ error: "Supplier name is required" });
        }
        if (!nextUnit) {
            return res.status(400).json({ error: "Unit is required" });
        }
        if (nextFactorNum !== null && (Number.isNaN(nextFactorNum) || nextFactorNum <= 0)) {
            return res
                .status(400)
                .json({ error: "Conversion factor must be a valid number" });
        }
        if (!nextRule) {
            return res.status(400).json({ error: "Issue rule is required" });
        }
        if (nextQtyRaw === undefined || nextQtyRaw === null || nextQtyRaw === "") {
            return res.status(400).json({ error: "Stock quantity is required" });
        }
        if (Number.isNaN(nextQtyNum) || nextQtyNum < 0) {
            return res.status(400).json({ error: "Stock quantity must be a valid number" });
        }

        const effectiveFactor =
            nextFactorNum !== null
                ? nextFactorNum
                : String(nextDisplayUnit).toLowerCase() === "kg"
                ? 1000
                : 1;

        update.name = nextName;
        update.group = nextGroup;
        update.supplierName = nextSupplier;
        update.unit = String(nextDisplayUnit || nextUnit).trim();
        if (baseUnit !== undefined) update.baseUnit = nextBaseUnit || null;
        if (displayUnit !== undefined) update.displayUnit = nextDisplayUnit || null;
        if (conversionFactor !== undefined) {
            update.conversionFactor = nextFactorNum === null ? null : nextFactorNum;
        }
        update.issueRule = nextRule;
        update.stockOnHand = nextQtyNum * effectiveFactor;

        if (cycleDays !== undefined) {
            update.cycleDays =
                cycleDays === "" || cycleDays === null || cycleDays === undefined
                    ? null
                    : Number(cycleDays);
        }
        if (nextReceiveDate !== undefined) {
            update.nextReceiveDate = nextReceiveDate ? new Date(nextReceiveDate) : null;
        }

        const nextCycleDays = update.cycleDays ?? existing.cycleDays;
        const nextDate = update.nextReceiveDate ?? existing.nextReceiveDate;
        if (update.issueRule === "cycle") {
            const hasCycle = Number.isFinite(nextCycleDays) && nextCycleDays > 0;
            const hasDate = !!nextDate && !Number.isNaN(new Date(nextDate).getTime());
            if (!hasCycle && !hasDate) {
                return res.status(400).json({
                    error: "Cycle rule requires cycleDays or nextReceiveDate",
                });
            }
        }

        update.updatedAt = Date.now();

        const updated = await Ingredient.findByIdAndUpdate(req.params.id, update, {
            new: true,
        });

        if (!updated) {
            return res.status(404).json({ error: "Ingredient not found" });
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Ingredient.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Ingredient not found" });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
