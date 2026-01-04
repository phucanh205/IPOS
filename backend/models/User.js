import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    userID: {
        type: String,
        unique: true,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ["admin", "cashier", "kitchen"],
        required: true,
        default: "cashier",
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

// Pre-save hook to generate userID and hash password
userSchema.pre("save", async function (next) {
    // Generate userID if it's a new document and userID is not set
    if (this.isNew && !this.userID) {
        try {
            const User = this.constructor;
            const count = await User.countDocuments();
            // Format: USR001, USR002, etc.
            this.userID = `USR${String(count + 1).padStart(3, "0")}`;
        } catch (error) {
            return next(error);
        }
    }

    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) {
        this.updatedAt = Date.now();
        return next();
    }

    try {
        // Hash password with cost of 10
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        this.updatedAt = Date.now();
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
userSchema.index({ userID: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

export default User;
