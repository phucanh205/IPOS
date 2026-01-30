import HeldOrder from "./heldOrders.model.js";

export const heldOrderService = {
    async list({ search } = {}) {
        const query = {};

        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: "i" } },
                { tableNumber: { $regex: search, $options: "i" } },
            ];
        }

        const heldOrders = await HeldOrder.find(query)
            .populate("items.productId", "name image")
            .sort({ heldAt: -1 });

        return heldOrders;
    },

    async getById(id) {
        const heldOrder = await HeldOrder.findById(id).populate(
            "items.productId",
            "name image price"
        );

        if (!heldOrder) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Held order not found" };
            throw err;
        }

        return heldOrder;
    },

    async create(payload = {}) {
        const { tableNumber, orderType, items, subtotal, tax, total } = payload;

        if (!items || items.length === 0) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Order must have at least one item" };
            throw err;
        }

        const count = await HeldOrder.countDocuments();
        const orderNumber = `#${String(count + 1).padStart(4, "0")}`;

        const heldOrder = new HeldOrder({
            orderNumber,
            tableNumber: tableNumber || "Table 1",
            orderType: orderType || "Dine in",
            items: items.map((item) => {
                const product = item.product || {};
                return {
                    productId: item.productId || product._id,
                    productName: item.productName || product.name,
                    quantity: item.quantity,
                    price: item.price || product.price || 0,
                    totalPrice: item.totalPrice || item.quantity * (item.price || product.price || 0),
                    size: item.size,
                    sizeLabel: item.sizeLabel,
                    toppings: item.toppings || [],
                    notes: item.notes || "",
                };
            }),
            subtotal: subtotal || 0,
            tax: tax || 0,
            total: total || 0,
        });

        const savedOrder = await heldOrder.save();
        const populatedOrder = await HeldOrder.findById(savedOrder._id).populate(
            "items.productId",
            "name image"
        );

        return populatedOrder;
    },

    async remove(id) {
        const heldOrder = await HeldOrder.findByIdAndDelete(id);
        if (!heldOrder) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Held order not found" };
            throw err;
        }
        return { message: "Held order deleted successfully" };
    },
};
