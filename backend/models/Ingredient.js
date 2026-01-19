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
        enum: ["pcs", "kg", "box"],
        required: true,
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

    this.updatedAt = Date.now();
    next();
});

const Ingredient = mongoose.model("Ingredient", ingredientSchema);

export default Ingredient;
