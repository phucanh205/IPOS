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

export async function seedDefaultUsers() {
    try {
        // Check if users already exist
        const existingUsers = await User.countDocuments();
        if (existingUsers > 0) {
            console.log("Users already exist, skipping seed");
            return;
        }

        // Insert seed users one by one to avoid userID conflicts
        for (const userData of seedUsers) {
            const user = new User(userData);
            await user.save();
            console.log(`  - ${user.username} (${user.role}) - ID: ${user.userID}`);
        }

        console.log("Default users created successfully!");
        console.log("Login credentials:");
        console.log("  Admin: admin / admin123");
        console.log("  Cashier: cashier / cashier123"); 
        console.log("  Kitchen: kitchen / kitchen123");

    } catch (error) {
        console.error("Error seeding default users:", error);
    }
}
