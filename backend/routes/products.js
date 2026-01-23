import express from 'express';
import Product from '../models/Product.js';
import Recipe from "../models/Recipe.js";
import Ingredient from "../models/Ingredient.js";

const router = express.Router();

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeId = (v) => {
  if (!v) return "";
  return String(v?._id || v).trim();
};

// Get all products with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    // Filter by category (can be ID or slug)
    if (category && category !== 'all') {
      const Category = (await import('../models/Category.js')).default;
      const categoryDoc = await Category.findOne({
        $or: [
          { _id: category },
          { slug: category },
        ],
      });
      
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    // Search by name or barcode
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/availability", async (req, res) => {
  try {
    const productIdsRaw = Array.isArray(req.body?.productIds) ? req.body.productIds : [];
    const cartItemsRaw = Array.isArray(req.body?.cartItems) ? req.body.cartItems : [];

    const requestedIds = productIdsRaw.map(normalizeId).filter(Boolean);

    const cartQtyByProductId = new Map();
    for (const it of cartItemsRaw) {
      const pid = normalizeId(it?.productId || it?.product);
      const qty = safeNumber(it?.quantity, 0);
      if (!pid || qty <= 0) continue;
      cartQtyByProductId.set(pid, safeNumber(cartQtyByProductId.get(pid), 0) + qty);
    }

    const allProductIdsSet = new Set([
      ...requestedIds,
      ...Array.from(cartQtyByProductId.keys()),
    ]);
    const allProductIds = Array.from(allProductIdsSet).filter(Boolean);

    if (!allProductIds.length) {
      return res.json({ items: [] });
    }

    const recipes = await Recipe.find({ product: { $in: allProductIds }, isActive: true });
    const recipeByProductId = new Map(recipes.map((r) => [String(r.product), r]));

    const ingredientIdsSet = new Set();
    for (const r of recipes) {
      const items = Array.isArray(r?.items) ? r.items : [];
      for (const ri of items) {
        const ingId = normalizeId(ri?.ingredient);
        if (ingId) ingredientIdsSet.add(ingId);
      }
    }
    const ingredientIds = Array.from(ingredientIdsSet);

    const ingredients = ingredientIds.length
      ? await Ingredient.find({ _id: { $in: ingredientIds } })
      : [];
    const ingredientById = new Map(ingredients.map((i) => [String(i._id), i]));

    const baseRequiredByIngredientId = new Map();
    for (const [pid, qty] of cartQtyByProductId.entries()) {
      const recipe = recipeByProductId.get(pid);
      if (!recipe) continue;
      const items = Array.isArray(recipe?.items) ? recipe.items : [];
      for (const ri of items) {
        const ingId = normalizeId(ri?.ingredient);
        if (!ingId) continue;
        const perUnit = safeNumber(ri?.quantity, 0);
        if (perUnit <= 0) continue;
        baseRequiredByIngredientId.set(
          ingId,
          safeNumber(baseRequiredByIngredientId.get(ingId), 0) + perUnit * qty
        );
      }
    }

    const targets = requestedIds.length ? requestedIds : allProductIds;

    const items = targets.map((pid) => {
      const recipe = recipeByProductId.get(pid);
      if (!recipe) {
        return {
          productId: pid,
          canAdd: false,
          reason: "RECIPE_MISSING",
          shortages: [],
        };
      }

      const addRequiredByIngredientId = new Map();
      const recipeItems = Array.isArray(recipe?.items) ? recipe.items : [];
      for (const ri of recipeItems) {
        const ingId = normalizeId(ri?.ingredient);
        if (!ingId) continue;
        const perUnit = safeNumber(ri?.quantity, 0);
        if (perUnit <= 0) continue;
        addRequiredByIngredientId.set(
          ingId,
          safeNumber(addRequiredByIngredientId.get(ingId), 0) + perUnit
        );
      }

      const unionIdsSet = new Set([
        ...Array.from(baseRequiredByIngredientId.keys()),
        ...Array.from(addRequiredByIngredientId.keys()),
      ]);

      const shortages = [];
      for (const ingId of unionIdsSet) {
        const ing = ingredientById.get(ingId);
        const have = safeNumber(ing?.stockOnHand, 0);
        const needBase = safeNumber(baseRequiredByIngredientId.get(ingId), 0);
        const needAdd = safeNumber(addRequiredByIngredientId.get(ingId), 0);
        const need = needBase + needAdd;
        const shortage = need > have ? need - have : 0;
        if (shortage > 0) {
          shortages.push({
            ingredientId: ingId,
            ingredientName: String(ing?.name || "").trim(),
            baseUnit: String(ing?.baseUnit || "").trim(),
            have,
            need,
            shortage,
          });
        }
      }

      if (shortages.length) {
        return {
          productId: pid,
          canAdd: false,
          reason: "INSUFFICIENT_INGREDIENTS",
          shortages,
        };
      }

      return {
        productId: pid,
        canAdd: true,
        reason: null,
        shortages: [],
      };
    });

    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const { name, description, price, image, categoryId, barcode, tags, showOnPos } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({ 
        error: 'Thiếu thông tin bắt buộc: name, price, categoryId' 
      });
    }

    const product = new Product({
      name,
      description,
      price: Number(price),
      image: image || 'https://via.placeholder.com/200',
      category: categoryId,
      barcode,
      inStock: true,
    });

    const savedProduct = await product.save();
    const populatedProduct = await Product.findById(savedProduct._id)
      .populate('category', 'name slug');

    res.status(201).json(populatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, image, categoryId, barcode, tags, showOnPos } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (image) updateData.image = image;
    if (categoryId) updateData.category = categoryId;
    if (barcode !== undefined) updateData.barcode = barcode;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'category',
      'name slug'
    );
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

