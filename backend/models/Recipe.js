import mongoose from "mongoose";

const recipeItemSchema = new mongoose.Schema(
    {
        ingredient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ingredient",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const recipeSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            unique: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        items: {
            type: [recipeItemSchema],
            default: [],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { minimize: false }
);

recipeSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const Recipe = mongoose.model("Recipe", recipeSchema);

export default Recipe;
