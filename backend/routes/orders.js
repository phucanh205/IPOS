import express from "express";
import Order from "../models/Order.js";
import { getIO } from "../socket.js";

const router = express.Router();

// Get all orders
router.get("/", async (req, res) => {
    try {
        const { search, status, startDate, endDate } = req.query;
        let query = {};

        if (search) {
            // Search by order number, table number, or total amount
            const searchNumber = parseFloat(search);
            const isNumber = !isNaN(searchNumber);
            
            query.$or = [
                { orderNumber: { $regex: search, $options: "i" } },
                { tableNumber: { $regex: search, $options: "i" } },
            ];
            
            // If search is a number, also search by total amount
            if (isNumber) {
                query.$or.push({ total: searchNumber });
            }
        }

        if (status) {
            query.status = status;
        }

        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate + "T00:00:00.000Z");
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate + "T23:59:59.999Z");
            }
        }

        const orders = await Order.find(query)
            .populate("items.productId", "name image")
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single order
router.get("/:id", async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate(
            "items.productId",
            "name image price"
        );
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new order
router.post("/", async (req, res) => {
    try {
        const {
            tableNumber,
            orderType,
            paymentMethod,
            items,
            subtotal,
            tax,
            total,
            totalPaid,
            changeDue,
        } = req.body;

        if (!items || items.length === 0) {
            return res
                .status(400)
                .json({ error: "Order must have at least one item" });
        }

        // Generate order number
        const count = await Order.countDocuments();
        const orderNumber = `#${String(count + 1).padStart(4, "0")}`;

        const order = new Order({
            orderNumber,
            tableNumber: tableNumber || "Table 1",
            orderType: orderType || "Dine in",
            paymentMethod: paymentMethod || "Cash",
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
            totalPaid: totalPaid || total || 0,
            changeDue: changeDue || 0,
            status: "awaiting_kitchen",  // Đơn mới, chờ bếp nhận
            kitchenStatus: "new",
            sentToKitchenAt: new Date(),
        });

        const savedOrder = await order.save();
        const populatedOrder = await Order.findById(savedOrder._id).populate(
            "items.productId",
            "name image"
        );

        try {
            const io = getIO();
            io.to("kitchen").emit("new-order", populatedOrder);
        } catch (e) {
            // ignore if socket not initialized
        }

        res.status(201).json(populatedOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
