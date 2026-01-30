import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { initSocket } from "./socket.js";
import productRoutes from "./modules/products/products.routes.js";
import categoryRoutes from "./modules/categories/categories.routes.js";
import ingredientRoutes from "./modules/ingredients/ingredients.routes.js";
import recipeRoutes from "./modules/recipes/recipes.routes.js";
import uploadRoutes from "./modules/media/upload/upload.routes.js";
import heldOrderRoutes from "./modules/heldOrders/heldOrders.routes.js";
import orderRoutes from "./modules/orders/orders.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import kitchenRoutes from "./modules/kitchen/kitchen.routes.js";
import adminReceivingRoutes from "./modules/adminReceiving/adminReceiving.routes.js";
import toppingsRoutes from "./modules/toppings/toppings.routes.js";
import { authenticateAndCheckRole } from "./shared/middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
initSocket(httpServer);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use(
    "/api/ingredients",
    ...authenticateAndCheckRole("admin"),
    ingredientRoutes
);
app.use(
    "/api/recipes",
    ...authenticateAndCheckRole("admin"),
    recipeRoutes
);
app.use("/api/toppings", toppingsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/held-orders", heldOrderRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use(
    "/api/admin/receiving",
    ...authenticateAndCheckRole("admin"),
    adminReceivingRoutes
);
app.use(
    "/api/kitchen",
    ...authenticateAndCheckRole("kitchen"),
    kitchenRoutes
);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "POS Backend is running" });
});

// Connect to MongoDB
mongoose
    .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/pos_system")
    .then(() => {
        console.log("✅ Connected to MongoDB");
        httpServer.listen(PORT, () => {
            console.log(`Server đang chạy trên http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error(" Lỗi kết nối MongoDB:", error);
        process.exit(1);
    });

export { app, httpServer };
export default app;
