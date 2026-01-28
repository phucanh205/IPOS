import Ingredient from "../models/Ingredient.js";

export const toppingService = {
    async list() {
        const ingredients = await Ingredient.find({
            group: { $regex: /^topping$/i },
        }).sort({ name: 1 });

        const items = ingredients.map((ing) => ({
            _id: ing._id,
            name: ing.name,
        }));

        return { items };
    },
};
