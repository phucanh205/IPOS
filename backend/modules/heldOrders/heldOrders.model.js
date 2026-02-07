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
            // Do not use countDocuments() because deletions can cause duplicates.
            // Find the current max HLDxxx and increment.
            const last = await HeldOrder.findOne({ heldOrderID: /^HLD\d{3,}$/ })
                .sort({ heldOrderID: -1 })
                .select("heldOrderID")
                .lean();

            const lastNum = (() => {
                const id = String(last?.heldOrderID || "");
                const m = id.match(/^HLD(\d+)$/);
                return m ? Number(m[1]) : 0;
            })();

            let nextNum = lastNum + 1;
            let candidate = `HLD${String(nextNum).padStart(3, "0")}`;

            // Ensure uniqueness in case of concurrent creates
            let tries = 0;
            while (tries < 50) {
                const exists = await HeldOrder.findOne({ heldOrderID: candidate })
                    .select("_id")
                    .lean();
                if (!exists) break;
                nextNum += 1;
                candidate = `HLD${String(nextNum).padStart(3, "0")}`;
                tries += 1;
            }

            // Format: HLD001, HLD002, etc.
            this.heldOrderID = candidate;
        } catch (error) {
            return next(error);
        }
    }
    
    this.updatedAt = Date.now();
    next();
});

// Indexes
heldOrderSchema.index({ orderNumber: 1 });
heldOrderSchema.index({ heldAt: -1 });

const HeldOrder = mongoose.model("HeldOrder", heldOrderSchema);

export default HeldOrder;
