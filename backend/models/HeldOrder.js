import mongoose from "mongoose";

const heldOrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
    },
    tableNumber: {
        type: String,
        default: "Table 1",
    },
    orderType: {
        type: String,
        enum: ["Dine in", "Take away", "Delivery"],
        default: "Dine in",
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            productName: {
                type: String,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            price: {
                type: Number,
                required: true,
                min: 0,
            },
            totalPrice: {
                type: Number,
                required: true,
                min: 0,
            },
            size: String,
            sizeLabel: String,
            toppings: [String],
            notes: String,
        },
    ],
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    },
    tax: {
        type: Number,
        default: 0,
        min: 0,
    },
    total: {
        type: Number,
        required: true,
        min: 0,
    },
    heldAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const HeldOrder = mongoose.model("HeldOrder", heldOrderSchema);

export default HeldOrder;
