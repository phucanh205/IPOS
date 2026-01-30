import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../modules/auth/user.model.js";

dotenv.config();

const seedUsers = [
    {
        username: "admin",
        password: "admin123",
        role: "admin"
    },
    {
        username: "cashier",
        password: "cashier123", 
        role: "cashier"
    },
    {
        username: "kitchen",
        password: "kitchen123",
        role: "kitchen"
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/pos_system");
        console.log("✅ Connected to MongoDB");

        // Clear existing users
        await User.deleteMany({});
        console.log("🗑️ Cleared existing users");

        // Insert seed users one by one to avoid userID conflicts
        for (const userData of seedUsers) {
            const user = new User(userData);
            await user.save();
            console.log(`  - ${user.username} (${user.role}) - ID: ${user.userID}`);
        }

        console.log("\n✅ Database seeded successfully!");
        console.log("\n📝 Login credentials for testing:");
        console.log("  Admin: admin / admin123");
        console.log("  Cashier: cashier / cashier123"); 
        console.log("  Kitchen: kitchen / kitchen123");

    } catch (error) {
        console.error("❌ Error seeding database:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
}

seedDatabase();
