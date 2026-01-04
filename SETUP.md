# Setup Guide - POS System

## Quick Start

### 1. Install MongoDB

**Windows:**
- Download from https://www.mongodb.com/try/download/community
- Install and start MongoDB service

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

### 4. Access the Application

Open your browser and navigate to: `http://localhost:3000`

The app will automatically redirect to `/home` showing the POS interface.

## Troubleshooting

### MongoDB Connection Error

If you see "MongoDB connection error":
1. Make sure MongoDB is running
2. Check if the connection string in `backend/.env` is correct
3. Default connection: `mongodb://localhost:27017/pos_system`

### Port Already in Use

If port 5000 or 3000 is already in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change `port` in `frontend/vite.config.js`

### No Products Showing

1. Use the Products page to add products manually
2. Check MongoDB connection
3. Verify products exist in database:
   ```bash
   # Connect to MongoDB
   mongosh
   use pos_system
   db.products.find().pretty()
   ```

## Development

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with watch mode

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
Pos/
├── backend/
│   ├── models/          # MongoDB schemas
│   │   ├── Category.js
│   │   └── Product.js
│   ├── routes/          # API endpoints
│   │   ├── categories.js
│   │   └── products.js
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── CategoryFilters.jsx
│   │   │   ├── ProductGrid.jsx
│   │   │   └── DateTimeDisplay.jsx
│   │   ├── pages/       # Page components
│   │   │   └── Home.jsx
│   │   ├── services/    # API services
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
└── README.md
```



