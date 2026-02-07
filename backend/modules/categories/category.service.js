import Category from "./category.model.js";

const slugify = (s) => {
    const str = String(s || "")
        .trim()
        .toLowerCase();
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-+/g, "-");
};

const buildUniqueSlug = async ({ name, excludeId }) => {
    const base = slugify(name);
    if (!base) return "";
    let candidate = base;
    let i = 1;
    // try up to 50 suffixes
    while (i <= 50) {
        const q = { slug: candidate };
        if (excludeId) q._id = { $ne: excludeId };
        const exists = await Category.findOne(q).select("_id");
        if (!exists) return candidate;
        i += 1;
        candidate = `${base}-${i}`;
    }
    return `${base}-${Date.now()}`;
};

export const categoryService = {
    async list() {
        const categories = await Category.find().sort({ name: 1 });
        return categories;
    },

    async create({ name }) {
        if (!name || !String(name).trim()) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Category name is required" };
            throw err;
        }

        const trimmedName = String(name).trim();
        const slug = await buildUniqueSlug({ name: trimmedName });

        try {
            const category = await Category.create({ name: trimmedName, slug });
            return category;
        } catch (e) {
            const msg = String(e?.message || "");
            if (msg.includes("E11000") || msg.toLowerCase().includes("duplicate key")) {
                const keyValue = e?.keyValue && typeof e.keyValue === "object" ? e.keyValue : null;
                const duplicateField = keyValue ? Object.keys(keyValue)[0] : "";
                const duplicateValue = keyValue ? keyValue[duplicateField] : "";
                const err = new Error("DUPLICATE_KEY");
                err.status = 409;
                err.body = {
                    error: "Category already exists",
                    duplicateField,
                    duplicateValue,
                };
                throw err;
            }
            throw e;
        }
    },

    async getById(id) {
        const category = await Category.findById(id);
        if (!category) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Category not found" };
            throw err;
        }
        return category;
    },

    async update(id, { name }) {
        if (!name || !String(name).trim()) {
            const err = new Error("VALIDATION_ERROR");
            err.status = 400;
            err.body = { error: "Category name is required" };
            throw err;
        }

        const trimmedName = String(name).trim();
        const slug = await buildUniqueSlug({ name: trimmedName, excludeId: id });

        const updated = await Category.findByIdAndUpdate(
            id,
            { name: trimmedName, slug, updatedAt: Date.now() },
            { new: true }
        );

        if (!updated) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Category not found" };
            throw err;
        }

        return updated;
    },

    async remove(id) {
        const deleted = await Category.findByIdAndDelete(id);
        if (!deleted) {
            const err = new Error("NOT_FOUND");
            err.status = 404;
            err.body = { error: "Category not found" };
            throw err;
        }

        return { success: true };
    },
};
