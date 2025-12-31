import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

dotenv.config();

const categories = [
  { name: 'All Items', slug: 'all-items' },
  { name: 'Burgers', slug: 'burgers' },
  { name: 'Drinks', slug: 'drinks' },
  { name: 'Desserts', slug: 'desserts' },
  { name: 'Sides', slug: 'sides' },
  { name: 'Combos', slug: 'combos' },
  { name: 'Breakfast', slug: 'breakfast' },
];

const products = [
  // Drinks - Row 1
  {
    name: 'Cafe Sua',
    price: 30000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=400&fit=crop',
    barcode: 'DR001',
  },
  {
    name: 'Matcha Latte',
    price: 30000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=400&fit=crop',
    barcode: 'DR002',
  },
  {
    name: 'Trà Sua',
    price: 30000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1525385133512-5f31e16019f7?w=400&h=400&fit=crop',
    barcode: 'DR003',
  },
  {
    name: 'Bánh Mì',
    price: 30000,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
    barcode: 'BF001',
  },
  {
    name: 'Burger Bò',
    price: 50000,
    category: 'burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
    barcode: 'BG001',
  },
  {
    name: 'Cafe Sua',
    price: 30000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=400&fit=crop',
    barcode: 'DR004',
  },

  // Row 2
  {
    name: 'Burger Tôm',
    price: 50000,
    category: 'burgers',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859314?w=400&h=400&fit=crop',
    barcode: 'BG002',
  },
  {
    name: 'Bánh Kem',
    price: 30000,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
    barcode: 'DS001',
  },
  {
    name: 'Donut',
    price: 30000,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop',
    barcode: 'DS002',
  },
  {
    name: 'Bánh Dâu',
    price: 30000,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop',
    barcode: 'DS003',
  },
  {
    name: 'Kem Milo',
    price: 30000,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=400&fit=crop',
    barcode: 'DS004',
  },
  {
    name: 'Trà Kem',
    price: 30000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1525385133512-5f31e16019f7?w=400&h=400&fit=crop',
    barcode: 'DR005',
  },

  // Row 3
  {
    name: 'Trà Milo',
    price: 30000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop',
    barcode: 'DR006',
  },
  {
    name: 'O Long',
    price: 30000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
    barcode: 'DR007',
  },
  {
    name: 'Trà Dâu Tây',
    price: 30000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=400&fit=crop',
    barcode: 'DR008',
  },
  {
    name: 'Trà Chanh',
    price: 30000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
    barcode: 'DR009',
  },
  {
    name: 'Trà Ấm',
    price: 30000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
    barcode: 'DR010',
  },
  {
    name: 'Trà Thập Cẩm',
    price: 30000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
    barcode: 'DR011',
  },

  // Additional products to fill the screen
  {
    name: 'Cafe Đen',
    price: 25000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=400&fit=crop',
    barcode: 'DR012',
  },
  {
    name: 'Cappuccino',
    price: 35000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=400&fit=crop',
    barcode: 'DR013',
  },
  {
    name: 'Espresso',
    price: 28000,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=400&fit=crop',
    barcode: 'DR014',
  },
  {
    name: 'Burger Gà',
    price: 45000,
    category: 'burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
    barcode: 'BG003',
  },
  {
    name: 'Burger Phô Mai',
    price: 55000,
    category: 'burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
    barcode: 'BG004',
  },
  {
    name: 'Burger Cá',
    price: 48000,
    category: 'burgers',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859314?w=400&h=400&fit=crop',
    barcode: 'BG005',
  },
  {
    name: 'Bánh Mì Thịt Nướng',
    price: 35000,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
    barcode: 'BF002',
  },
  {
    name: 'Bánh Mì Pate',
    price: 32000,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
    barcode: 'BF003',
  },
  {
    name: 'Bánh Mì Chả Cá',
    price: 38000,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
    barcode: 'BF004',
  },
  {
    name: 'Tiramisu',
    price: 45000,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop',
    barcode: 'DS005',
  },
  {
    name: 'Cheesecake',
    price: 40000,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
    barcode: 'DS006',
  },
  {
    name: 'Bánh Flan',
    price: 28000,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop',
    barcode: 'DS007',
  },
  {
    name: 'Khoai Tây Chiên',
    price: 25000,
    category: 'sides',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
    barcode: 'SD001',
  },
  {
    name: 'Gà Rán',
    price: 40000,
    category: 'sides',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop',
    barcode: 'SD002',
  },
  {
    name: 'Cánh Gà Nướng',
    price: 45000,
    category: 'sides',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop',
    barcode: 'SD003',
  },
  {
    name: 'Nem Nướng',
    price: 35000,
    category: 'sides',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
    barcode: 'SD004',
  },
  {
    name: 'Combo Burger + Nước',
    price: 70000,
    category: 'combos',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859314?w=400&h=400&fit=crop',
    barcode: 'CB001',
  },
  {
    name: 'Combo Bữa Sáng',
    price: 60000,
    category: 'combos',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
    barcode: 'CB002',
  },
  {
    name: 'Combo Gia Đình',
    price: 150000,
    category: 'combos',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859314?w=400&h=400&fit=crop',
    barcode: 'CB003',
  },
  {
    name: 'Combo Đôi',
    price: 120000,
    category: 'combos',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
    barcode: 'CB004',
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_system'
    );
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert categories (skip "All Items" as it's not a real category)
    const categoryDocs = await Category.insertMany(
      categories.filter((cat) => cat.slug !== 'all-items')
    );
    console.log(`✅ Inserted ${categoryDocs.length} categories`);

    // Create category map
    const categoryMap = {};
    categoryDocs.forEach((cat) => {
      categoryMap[cat.slug] = cat._id;
    });

    // Insert products with category references
    const productsWithCategories = products.map((product) => ({
      ...product,
      category: categoryMap[product.category],
    }));

    const productDocs = await Product.insertMany(productsWithCategories);
    console.log(`✅ Inserted ${productDocs.length} products`);

    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

