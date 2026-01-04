import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    orderID: {
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
    paymentMethod: {
        type: String,
        enum: ["Cash", "Card", "QR Code"],
        default: "Cash",
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
    totalPaid: {
        type: Number,
        required: true,
        min: 0,
    },
    changeDue: {
        type: Number,
        default: 0,
        min: 0,
    },
    status: {
        type: String,
        enum: [
            "pending", // Đơn chờ thanh toán (giữ lại cho tương thích)
            "awaiting_kitchen", // Đơn mới, chờ bếp nhận
            "in_progress", // Bếp đang chế biến
            "completed", // Hoàn thành (giữ lại cho tương thích)
            "cancelled", // Đã hủy
            "kitchen_rejected", // Bếp từ chối
        ],
        default: "awaiting_kitchen",
    },
    // Kitchen workflow tracking
    kitchenStatus: {
        type: String,
        enum: [
            "new", // Mới, chờ bếp nhận
            "accepted", // Bếp đã nhận
            "cooking", // Đang chế biến
            "completed", // Đã xong
            "rejected", // Bếp từ chối
        ],
        default: "new",
    },
    // Kitchen acceptance/rejection
    kitchenAcceptedAt: {
        type: Date,
    },
    kitchenStartedAt: {
        type: Date, // Khi bắt đầu chế biến
    },
    kitchenCompletedAt: {
        type: Date, // Khi hoàn thành chế biến
    },
    kitchenRejectedAt: {
        type: Date,
    },
    kitchenRejectionReason: {
        type: String, // Lý do từ chối
    },
    // Order lifecycle timestamps
    sentToKitchenAt: {
        type: Date,
        default: Date.now, // Khi đơn được gửi đến bếp
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

// Pre-save hook to generate orderID and update updatedAt
orderSchema.pre("save", async function (next) {
    // Generate orderID if it's a new document and orderID is not set
    if (this.isNew && !this.orderID) {
        try {
            const Order = this.constructor;
            const count = await Order.countDocuments();
            // Format: ORD001, ORD002, etc.
            this.orderID = `ORD${String(count + 1).padStart(3, "0")}`;
        } catch (error) {
            return next(error);
        }
    }

    this.updatedAt = Date.now();
    next();
});

// Indexes for better query performance
orderSchema.index({ orderID: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ kitchenStatus: 1, sentToKitchenAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdBy: 1 });
orderSchema.index({ kitchenAcceptedBy: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
