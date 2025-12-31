# POS System - Demo Application

A Point of Sale (POS) system demo with React frontend and Node.js backend.

## Features

- 🏠 Home screen with product catalog
- 🔍 Search products by name or barcode
- 🏷️ Filter products by category
- 📱 Responsive design
- 🎨 Modern UI with TailwindCSS

## Tech Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router

### Backend
- Node.js
- Express
- MongoDB
- Mongoose

## Project Structure

```
.
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── scripts/         # Seed scripts
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── App.jsx      # Main app component
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or MongoDB Atlas)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional, defaults are set):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pos_system
```

4. Start MongoDB (if running locally):
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

5. Seed the database:
```bash
npm run seed
```

6. Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## API Endpoints

### Products
- `GET /api/products` - Get all products
  - Query params: `category`, `search`
- `GET /api/products/:id` - Get single product

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category

## Demo Data

The seed script creates:
- 7 categories (Burgers, Drinks, Desserts, Sides, Combos, Breakfast)
- 18+ products across different categories

## Notes

- No authentication required (demo only)
- No cart functionality (UI only)
- Products are fetched from MongoDB
- Search and filter work in real-time



