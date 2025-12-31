import express from "express";
import HeldOrder from "../models/HeldOrder.js";

const router = express.Router();

// Get all held orders
router.get("/", async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: "i" } },
                { tableNumber: { $regex: search, $options: "i" } },
            ];
        }

        const heldOrders = await HeldOrder.find(query)
            .populate("items.productId", "name image")
            .sort({ heldAt: -1 });

        res.json(heldOrders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single held order
router.get("/:id", async (req, res) => {
    try {
        const heldOrder = await HeldOrder.findById(req.params.id).populate(
            "items.productId",
            "name image price"
        );
        if (!heldOrder) {
            return res.status(404).json({ error: "Held order not found" });
        }
        res.json(heldOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new held order
router.post("/", async (req, res) => {
    try {
        const { tableNumber, orderType, items, subtotal, tax, total } =
            req.body;

        if (!items || items.length === 0) {
            return res
                .status(400)
                .json({ error: "Order must have at least one item" });
        }

        // Generate order number
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
                    totalPrice:
                        item.totalPrice ||
                        item.quantity * (item.price || product.price || 0),
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
        const populatedOrder = await HeldOrder.findById(
            savedOrder._id
        ).populate("items.productId", "name image");

        res.status(201).json(populatedOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete held order
router.delete("/:id", async (req, res) => {
    try {
        const heldOrder = await HeldOrder.findByIdAndDelete(req.params.id);
        if (!heldOrder) {
            return res.status(404).json({ error: "Held order not found" });
        }
        res.json({ message: "Held order deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
