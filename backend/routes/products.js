import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

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

