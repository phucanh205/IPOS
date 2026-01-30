import mongoose from "mongoose";

const lowStockAlertSchema = new mongoose.Schema({
    ingredientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ingredient",
        required: true,
        unique: true,
        index: true,
    },
    status: {
        type: String,
        enum: ["open", "reported", "checked", "resolved"],
        default: "open",
        index: true,
    },
    firstSeenAt: {
        type: Date,
        default: Date.now,
    },
    lastSeenAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    reportedAt: {
        type: Date,
        default: null,
    },
    reportedBy: {
        userID: { type: String, default: "" },
        username: { type: String, default: "" },
        role: { type: String, default: "" },
    },
    checkedAt: {
        type: Date,
        default: null,
    },
    checkedBy: {
        userID: { type: String, default: "" },
        username: { type: String, default: "" },
        role: { type: String, default: "" },
    },
    resolvedAt: {
        type: Date,
        default: null,
    },
});

lowStockAlertSchema.index({ status: 1, lastSeenAt: -1 });

const LowStockAlert = mongoose.model("LowStockAlert", lowStockAlertSchema);

export default LowStockAlert;
