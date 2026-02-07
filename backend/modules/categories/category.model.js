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
        trim: true,
    },
    slug: {
        type: String,
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
            // Do not use countDocuments() because deletions can cause duplicates.
            // Find the current max CATxxx and increment.
            const last = await Category.findOne({ categoryID: /^CAT\d{3,}$/ })
                .sort({ categoryID: -1 })
                .select("categoryID")
                .lean();

            const lastNum = (() => {
                const id = String(last?.categoryID || "");
                const m = id.match(/^CAT(\d+)$/);
                return m ? Number(m[1]) : 0;
            })();

            let nextNum = lastNum + 1;
            let candidate = `CAT${String(nextNum).padStart(3, "0")}`;

            // Ensure uniqueness in case of concurrent creates
            // try up to 50 times
            let tries = 0;
            while (tries < 50) {
                const exists = await Category.findOne({ categoryID: candidate })
                    .select("_id")
                    .lean();
                if (!exists) break;
                nextNum += 1;
                candidate = `CAT${String(nextNum).padStart(3, "0")}`;
                tries += 1;
            }

            this.categoryID = candidate;
        } catch (error) {
            return next(error);
        }
    }

    // Update updatedAt
    this.updatedAt = Date.now();
    next();
});

// Indexes
categorySchema.index({ slug: 1 }, { sparse: true });

const Category = mongoose.model("Category", categorySchema);

export default Category;
