import express from "express";
import Order from "../models/Order.js";
import { getIO } from "../socket.js";

const router = express.Router();

router.get("/orders", async (req, res) => {
    try {
        const { kitchenStatus, status, limit = 50 } = req.query;

        const query = {};
        if (kitchenStatus) query.kitchenStatus = kitchenStatus;
        if (status) query.status = status;

        const orders = await Order.find(query)
            .populate("items.productId", "name image")
            .sort({ sentToKitchenAt: -1, createdAt: -1 })
            .limit(Math.min(Number(limit) || 50, 200));

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch("/orders/:id/kitchen-status", async (req, res) => {
    try {
        const { kitchenStatus, rejectionReason } = req.body;
        const allowed = ["new", "accepted", "cooking", "completed", "rejected"];

        if (!allowed.includes(kitchenStatus)) {
            return res.status(400).json({
                error: "Invalid kitchenStatus",
                allowed,
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        order.kitchenStatus = kitchenStatus;

        if (kitchenStatus === "accepted") {
            order.status = "in_progress";
            order.kitchenAcceptedAt = new Date();
        }

        if (kitchenStatus === "cooking") {
            order.status = "in_progress";
            order.kitchenStartedAt = new Date();
        }

        if (kitchenStatus === "completed") {
            order.status = "completed";
            order.kitchenCompletedAt = new Date();
        }

        if (kitchenStatus === "rejected") {
            order.status = "kitchen_rejected";
            order.kitchenRejectedAt = new Date();
            order.kitchenRejectionReason = rejectionReason || "";
        }

        await order.save();

        const populatedOrder = await Order.findById(order._id).populate(
            "items.productId",
            "name image"
        );

        try {
            const io = getIO();
            io.to("cashier").emit("order-status-updated", populatedOrder);
            io.to("kitchen").emit("order-status-updated", populatedOrder);
        } catch (e) {
            // ignore if socket not initialized
        }

        res.json(populatedOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
