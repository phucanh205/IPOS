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
      // Do not use countDocuments() because deletions can cause duplicates.
      // Find the current max PRDxxx and increment.
      const last = await Product.findOne({ productID: /^PRD\d{3,}$/ })
        .sort({ productID: -1 })
        .select("productID")
        .lean();

      const lastNum = (() => {
        const id = String(last?.productID || "");
        const m = id.match(/^PRD(\d+)$/);
        return m ? Number(m[1]) : 0;
      })();

      let nextNum = lastNum + 1;
      let candidate = `PRD${String(nextNum).padStart(3, "0")}`;

      // Ensure uniqueness in case of concurrent creates
      let tries = 0;
      while (tries < 50) {
        const exists = await Product.findOne({ productID: candidate })
          .select("_id")
          .lean();
        if (!exists) break;
        nextNum += 1;
        candidate = `PRD${String(nextNum).padStart(3, "0")}`;
        tries += 1;
      }

      // Format: PRD001, PRD002, etc.
      this.productID = candidate;
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



