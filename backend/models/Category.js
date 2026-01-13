import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    categoryID: {
        type: String,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
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

// Pre-save hook to generate categoryID and update updatedAt
categorySchema.pre("save", async function (next) {
    // Generate categoryID if it's a new document and categoryID is not set
    if (this.isNew && !this.categoryID) {
        try {
            const Category = this.constructor;
            const count = await Category.countDocuments();
            // Format: CAT001, CAT002, etc.
            this.categoryID = `CAT${String(count + 1).padStart(3, "0")}`;
        } catch (error) {
            return next(error);
        }
    }

    // Update updatedAt
    this.updatedAt = Date.now();
    next();
});

// Indexes
categorySchema.index({ slug: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
