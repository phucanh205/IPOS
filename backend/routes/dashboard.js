import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// Get dashboard statistics
router.get("/stats", async (req, res) => {
    try {
        const { date } = req.query; // Optional date filter (YYYY-MM-DD format)
        
        // Build date filter
        let dateFilter = {};
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            dateFilter.createdAt = { $gte: startDate, $lte: endDate };
        } else {
            // Default to today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateFilter.createdAt = { $gte: today, $lt: tomorrow };
        }

        // Get yesterday for comparison
        const yesterday = new Date(dateFilter.createdAt.$gte || new Date());
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);
        const yesterdayFilter = {
            createdAt: { $gte: yesterday, $lte: yesterdayEnd },
            status: "completed",
        };

        // Today's stats
        const todayOrders = await Order.find({
            ...dateFilter,
            status: "completed",
        });

        // Yesterday's stats
        const yesterdayOrders = await Order.find(yesterdayFilter);

        // Calculate today's revenue and order count
        const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const todayOrderCount = todayOrders.length;

        // Calculate yesterday's revenue and order count
        const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const yesterdayOrderCount = yesterdayOrders.length;

        // Calculate percentage changes
        const revenueChange = yesterdayRevenue > 0 
            ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
            : (todayRevenue > 0 ? 100 : 0);
        const orderCountChange = yesterdayOrderCount > 0 
            ? ((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 100 
            : (todayOrderCount > 0 ? 100 : 0);

        // Get best-selling items (from today's orders)
        const productSales = {};
        todayOrders.forEach((order) => {
            order.items.forEach((item) => {
                const productId = item.productId?.toString() || item.productId;
                const productName = item.productName || "Unknown";
                const quantity = item.quantity || 0;
                const price = item.price || 0;
                
                // Use productId as key, fallback to productName if no productId
                const key = productId || productName;

                if (!productSales[key]) {
                    productSales[key] = {
                        productId: productId || null,
                        productName,
                        price,
                        totalQuantity: 0,
                        totalRevenue: 0,
                    };
                }
                productSales[key].totalQuantity += quantity;
                productSales[key].totalRevenue += item.totalPrice || (quantity * price);
            });
        });

        // Convert to array and sort by quantity
        const bestSellingItems = Object.values(productSales)
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, 10); // Top 10

        // Get recent orders (last 6)
        const recentOrders = await Order.find({ status: "completed" })
            .sort({ createdAt: -1 })
            .limit(6)
            .select("orderNumber createdAt orderType tableNumber paymentMethod total");

        res.json({
            revenue: {
                today: todayRevenue,
                yesterday: yesterdayRevenue,
                change: revenueChange,
            },
            orders: {
                today: todayOrderCount,
                yesterday: yesterdayOrderCount,
                change: orderCountChange,
            },
            bestSellingItems,
            recentOrders,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

