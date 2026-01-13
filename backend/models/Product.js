import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productID: {
    type: String,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/200',
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  barcode: {
    type: String,
    trim: true,
  },
  inStock: {
    type: Boolean,
    default: true,
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

// Pre-save hook to generate productID and update updatedAt
productSchema.pre("save", async function (next) {
  // Generate productID if it's a new document and productID is not set
  if (this.isNew && !this.productID) {
    try {
      const Product = this.constructor;
      const count = await Product.countDocuments();
      // Format: PRD001, PRD002, etc.
      this.productID = `PRD${String(count + 1).padStart(3, "0")}`;
    } catch (error) {
      return next(error);
    }
  }
  
  // Update updatedAt
  this.updatedAt = Date.now();
  next();
});

// Indexes


const Product = mongoose.model('Product', productSchema);

export default Product;



