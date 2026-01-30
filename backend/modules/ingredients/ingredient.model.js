import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
    ingredientID: {
        type: String,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    group: {
        type: String,
        trim: true,
        default: "",
    },
    supplierName: {
        type: String,
        trim: true,
        default: "",
    },
    unit: {
        type: String,
        required: true,
    },
    baseUnit: {
        type: String,
        enum: ["pcs", "g", "ml"],
        default: function () {
            const u = String(this.unit || "").toLowerCase();
            if (u === "kg") return "g";
            if (u === "pcs") return "pcs";
            if (u === "box") return "pcs";
            return u || "pcs";
        },
    },
    displayUnit: {
        type: String,
        default: function () {
            return String(this.unit || "").trim() || "pcs";
        },
    },
    conversionFactor: {
        type: Number,
        min: 0,
        default: function () {
            const u = String(this.unit || "").toLowerCase();
            if (u === "kg") return 1000;
            return 1;
        },
    },
    issueRule: {
        type: String,
        enum: ["daily", "long_storage", "cycle"],
        required: true,
    },
    cycleDays: {
        type: Number,
        default: null,
    },
    nextReceiveDate: {
        type: Date,
        default: null,
    },
    stockOnHand: {
        type: Number,
        default: 0,
    },
    parLevel: {
        type: Number,
        default: null,
    },
    minStockLevel: {
        type: Number,
        default: null,
    },
    lastReceivedAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

ingredientSchema.pre("save", async function (next) {
    if (this.isNew && !this.ingredientID) {
        try {
            const Ingredient = this.constructor;
            const count = await Ingredient.countDocuments();
            this.ingredientID = `ING${String(count + 1).padStart(3, "0")}`;
        } catch (error) {
            return next(error);
        }
    }

    if (!this.baseUnit) {
        const u = String(this.unit || "").toLowerCase();
        if (u === "kg") this.baseUnit = "g";
        else if (u === "pcs") this.baseUnit = "pcs";
        else if (u === "box") this.baseUnit = "pcs";
        else this.baseUnit = u || "pcs";
    }
    if (!this.displayUnit) {
        this.displayUnit = String(this.unit || "").trim() || this.baseUnit || "pcs";
    }
    if (!this.conversionFactor || Number(this.conversionFactor) <= 0) {
        const u = String(this.unit || "").toLowerCase();
        this.conversionFactor = u === "kg" ? 1000 : 1;
    }

    if (this.parLevel === null || this.parLevel === undefined) {
        this.parLevel = typeof this.stockOnHand === "number" ? this.stockOnHand : 0;
    }
    if (this.minStockLevel === null || this.minStockLevel === undefined) {
        if (this.issueRule === "long_storage") {
            const base = typeof this.parLevel === "number" ? this.parLevel : 0;
            this.minStockLevel = base / 2;
        }
    }

    this.updatedAt = Date.now();
    next();
});

const Ingredient = mongoose.model("Ingredient", ingredientSchema);

export default Ingredient;
