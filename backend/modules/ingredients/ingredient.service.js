import Ingredient from "./ingredient.model.js";

const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};

const addDays = (d, days) => {
    const x = new Date(d);
    x.setDate(x.getDate() + Number(days || 0));
    return x;
};

export const ingredientService = {
    async list({ search = "" } = {}) {
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
        return ingredients;
    },

    async create(payload = {}) {
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
        } = payload;

        if (!name || !String(name).trim()) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Ingredient name is required" };
            throw err;
        }
        if (!group || !String(group).trim()) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Ingredient group is required" };
            throw err;
        }
        if (!supplierName || !String(supplierName).trim()) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Supplier name is required" };
            throw err;
        }
        if (!unit) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Unit is required" };
            throw err;
        }

        const factorNum =
            conversionFactor === undefined || conversionFactor === null || conversionFactor === ""
                ? null
                : Number(conversionFactor);
        if (factorNum !== null && (Number.isNaN(factorNum) || factorNum <= 0)) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Conversion factor must be a valid number" };
            throw err;
        }
        if (!issueRule) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Issue rule is required" };
            throw err;
        }
        if (stockOnHand === undefined || stockOnHand === null || stockOnHand === "") {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Stock quantity is required" };
            throw err;
        }
        const qtyNum = Number(stockOnHand);
        if (Number.isNaN(qtyNum) || qtyNum < 0) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Stock quantity must be a valid number" };
            throw err;
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
            cycleDays:
                cycleDays === "" || cycleDays === null || cycleDays === undefined
                    ? null
                    : Number(cycleDays),
            nextReceiveDate: nextReceiveDate ? new Date(nextReceiveDate) : null,
        };

        if (normalized.issueRule === "cycle") {
            const hasCycle =
                Number.isFinite(normalized.cycleDays) && normalized.cycleDays > 0;
            const hasDate =
                normalized.nextReceiveDate instanceof Date &&
                !Number.isNaN(normalized.nextReceiveDate.getTime());
            if (!hasCycle && !hasDate) {
                const err = new Error("VALIDATION_ERROR");
                err.status = 400;
                err.body = { error: "Cycle rule requires cycleDays or nextReceiveDate" };
                throw err;
            }

            if (!hasDate && hasCycle) {
                normalized.nextReceiveDate = addDays(startOfDay(new Date()), normalized.cycleDays);
            }
        }

        const created = await Ingredient.create(normalized);
        return created;
    },

    async update(id, payload = {}) {
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
        } = payload;

        const existing = await Ingredient.findById(id);
        if (!existing) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Ingredient not found" };
            throw err;
        }

        const update = {};

        const nextName =
            name !== undefined ? String(name || "").trim() : String(existing.name || "").trim();
        const nextGroup =
            group !== undefined
                ? String(group || "").trim()
                : String(existing.group || "").trim();
        const nextSupplier =
            supplierName !== undefined
                ? String(supplierName || "").trim()
                : String(existing.supplierName || "").trim();
        const nextUnit = unit !== undefined ? unit : existing.unit;
        const nextDisplayUnit =
            displayUnit !== undefined
                ? String(displayUnit || "").trim()
                : String(existing.displayUnit || existing.unit || "").trim();
        const nextBaseUnit =
            baseUnit !== undefined
                ? String(baseUnit || "").trim()
                : String(existing.baseUnit || "").trim();
        const nextFactorRaw = conversionFactor !== undefined ? conversionFactor : existing.conversionFactor;
        const nextFactorNum =
            nextFactorRaw === undefined || nextFactorRaw === null || nextFactorRaw === ""
                ? null
                : Number(nextFactorRaw);
        const nextRule = issueRule !== undefined ? issueRule : existing.issueRule;
        const nextQtyRaw = stockOnHand !== undefined ? stockOnHand : existing.stockOnHand;
        const nextQtyNum = Number(nextQtyRaw);

        if (!nextName) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Ingredient name is required" };
            throw err;
        }
        if (!nextGroup) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Ingredient group is required" };
            throw err;
        }
        if (!nextSupplier) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Supplier name is required" };
            throw err;
        }
        if (!nextUnit) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Unit is required" };
            throw err;
        }
        if (nextFactorNum !== null && (Number.isNaN(nextFactorNum) || nextFactorNum <= 0)) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Conversion factor must be a valid number" };
            throw err;
        }
        if (!nextRule) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Issue rule is required" };
            throw err;
        }
        if (nextQtyRaw === undefined || nextQtyRaw === null || nextQtyRaw === "") {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Stock quantity is required" };
            throw err;
        }
        if (Number.isNaN(nextQtyNum) || nextQtyNum < 0) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Stock quantity must be a valid number" };
            throw err;
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
                const err = new Error("VALIDATION_ERROR");
                err.status = 400;
                err.body = { error: "Cycle rule requires cycleDays or nextReceiveDate" };
                throw err;
            }

            if (!hasDate && hasCycle) {
                update.nextReceiveDate = addDays(startOfDay(new Date()), nextCycleDays);
            }
        }

        update.updatedAt = Date.now();

        const updated = await Ingredient.findByIdAndUpdate(id, update, {
            new: true,
        });

        if (!updated) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Ingredient not found" };
            throw err;
        }

        return updated;
    },

    async remove(id) {
        const deleted = await Ingredient.findByIdAndDelete(id);
        if (!deleted) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Ingredient not found" };
            throw err;
        }
        return { success: true };
    },
};
