import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

const toYmd = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

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

        const baseDate = date ? new Date(date) : new Date();
        baseDate.setHours(0, 0, 0, 0);
        const rangeStart = new Date(baseDate);
        rangeStart.setDate(rangeStart.getDate() - 6);
        const rangeEnd = new Date(baseDate);
        rangeEnd.setHours(23, 59, 59, 999);

        const prevRangeStart = new Date(rangeStart);
        prevRangeStart.setDate(prevRangeStart.getDate() - 7);
        const prevRangeEnd = new Date(rangeStart);
        prevRangeEnd.setMilliseconds(-1);

        const dailyAgg = await Order.aggregate([
            {
                $match: {
                    status: "completed",
                    createdAt: { $gte: rangeStart, $lte: rangeEnd },
                },
            },
            {
                $group: {
                    _id: {
                        y: { $year: "$createdAt" },
                        m: { $month: "$createdAt" },
                        d: { $dayOfMonth: "$createdAt" },
                    },
                    revenue: { $sum: { $ifNull: ["$total", 0] } },
                    orders: { $sum: 1 },
                },
            },
            {
                $sort: {
                    "_id.y": 1,
                    "_id.m": 1,
                    "_id.d": 1,
                },
            },
        ]);

        const dailyMap = new Map();
        dailyAgg.forEach((row) => {
            const y = row?._id?.y;
            const m = row?._id?.m;
            const d = row?._id?.d;
            if (!y || !m || !d) return;
            const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            dailyMap.set(key, {
                date: key,
                revenue: row.revenue || 0,
                orders: row.orders || 0,
            });
        });

        const dailyRevenue = [];
        for (let i = 0; i < 7; i++) {
            const dt = new Date(rangeStart);
            dt.setDate(rangeStart.getDate() + i);
            const key = toYmd(dt);
            dailyRevenue.push(dailyMap.get(key) || { date: key, revenue: 0, orders: 0 });
        }

        const prev7Agg = await Order.aggregate([
            {
                $match: {
                    status: "completed",
                    createdAt: { $gte: prevRangeStart, $lte: prevRangeEnd },
                },
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: { $ifNull: ["$total", 0] } },
                    orders: { $sum: 1 },
                },
            },
        ]);

        const prev7Total = prev7Agg?.[0]?.revenue || 0;

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
            dailyRevenue,
            prev7Total,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
