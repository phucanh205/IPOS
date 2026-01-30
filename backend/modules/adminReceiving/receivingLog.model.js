import mongoose from "mongoose";

const receivingItemSchema = new mongoose.Schema(
    {
        ingredientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ingredient",
            required: true,
        },
        ingredientName: {
            type: String,
            required: true,
            trim: true,
        },
        displayUnit: {
            type: String,
            default: "",
        },
        suggestedQty: {
            type: Number,
            default: null,
        },
        receivedQty: {
            type: Number,
            default: null,
        },
        note: {
            type: String,
            default: "",
        },
    },
    { _id: false }
);

const receivingLogSchema = new mongoose.Schema({
    dateKey: {
        type: String,
        required: true,
        index: true,
    },
    receivedAt: {
        type: Date,
        required: true,
        default: Date.now,
        index: true,
    },
    createdBy: {
        userID: { type: String, default: "" },
        username: { type: String, default: "" },
        role: { type: String, default: "" },
    },
    items: {
        type: [receivingItemSchema],
        default: [],
    },
});

receivingLogSchema.index({ dateKey: 1, receivedAt: -1 });

const ReceivingLog = mongoose.model("ReceivingLog", receivingLogSchema);

export default ReceivingLog;
