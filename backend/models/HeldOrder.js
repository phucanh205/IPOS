import mongoose from "mongoose";

const heldOrderSchema = new mongoose.Schema({
    heldOrderID: {
        type: String,
        unique: true,
        trim: true,
    },
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
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Pre-save hook to generate heldOrderID and update updatedAt
heldOrderSchema.pre("save", async function (next) {
    // Generate heldOrderID if it's a new document and heldOrderID is not set
    if (this.isNew && !this.heldOrderID) {
        try {
            const HeldOrder = this.constructor;
            const count = await HeldOrder.countDocuments();
            // Format: HLD001, HLD002, etc.
            this.heldOrderID = `HLD${String(count + 1).padStart(3, "0")}`;
        } catch (error) {
            return next(error);
        }
    }
    
    this.updatedAt = Date.now();
    next();
});

// Indexes
heldOrderSchema.index({ heldOrderID: 1 });
heldOrderSchema.index({ orderNumber: 1 });
heldOrderSchema.index({ heldAt: -1 });

const HeldOrder = mongoose.model("HeldOrder", heldOrderSchema);

export default HeldOrder;
