# IPOS (Hệ thống POS nội bộ)

IPOS là hệ thống POS (bán hàng tại quầy) đơn giản dành cho quán ăn/quán cafe.

Hệ thống xoay quanh 3 vai trò chính:

- Thu ngân: chọn sản phẩm, tạo giỏ hàng, giữ đơn tạm và tạo đơn gửi bếp.
- Bếp : nhận đơn, cập nhật trạng thái chế biến và có thể từ chối đơn kèm lý do.
- Quản trị: quản lý sản phẩm, danh mục, nguyên liệu, công thức (recipe), nhập hàng (receiving) và xem thống kê.

 # Logic tổng quan (đơn giản)

 1) Luồng bán hàng (Thu ngân)

1. Thu ngân mở POS.
2. Thu ngân lọc/tìm kiếm sản phẩm.
3. Thu ngân thêm sản phẩm vào giỏ.
4. Hệ thống kiểm tra khả năng bán dựa trên tồn kho/công thức (recipe).
5. Thu ngân có thể:
   - **Giữ đơn** (lưu tạm)
   - **Tạo đơn** (tạo order và gửi cho bếp)

# 2) Luồng bếp

1. Bếp xem danh sách đơn đến.
2. Bếp cập nhật trạng thái (ví dụ: đang làm/hoàn thành).
3. Bếp có thể **từ chối** đơn kèm lý do; thu ngân sẽ nhận thông báo.

# 3) Luồng kho (Nguyên liệu / Công thức / Nhập hàng)

- Nguyên liệu: lưu tồn kho và cấu hình đơn vị.
- Công thức (Recipes)** định nghĩa lượng nguyên liệu tiêu hao cho mỗi sản phẩm.
- Nhập hàng : ghi nhận/xác nhận nguyên liệu đã nhận và cập nhật tồn.

#4) Cập nhật realtime

Ứng dụng dùng **Socket.IO** để đẩy các cập nhật quan trọng (ví dụ: thay đổi trạng thái bếp, đơn bị từ chối) mà không cần refresh.

## Công nghệ sử dụng

### Frontend

- **React + Vite**
- **Tailwind CSS**
- **axios** (gọi API)
- **socket.io-client** (realtime)

### Backend

- **Node.js + Express**
- **MongoDB + Mongoose**
- **JWT** (xác thực)
- **multer** (upload ảnh)
- **socket.io** (realtime)

## Cấu trúc dự án

- `frontend/`: ứng dụng React (UI)
- `backend/`: server API Express
- `backend/modules/`: các module chức năng (auth, products, categories, ingredients, recipes, orders, held-orders, upload, ...)
- `backend/uploads/`: nơi lưu ảnh upload (truy cập qua `/uploads/...`)

## Chạy local

### Yêu cầu

- Node.js 18+ (khuyến nghị)
- MongoDB chạy local hoặc có connection string trong `backend/.env`

### Cấu hình môi trường (Backend)

Backend sử dụng `dotenv` để load biến môi trường từ file `.env`.

1. Copy file mẫu:

```bash
cp backend/.env.example backend/.env
```

2. Cập nhật các giá trị trong `backend/.env` nếu cần.

Các biến quan trọng:

- `PORT`: cổng chạy backend (mặc định `5000`).
- `MONGODB_URI`: chuỗi kết nối MongoDB.
- `JWT_SECRET`: khoá ký JWT (bắt buộc nên để chuỗi dài/ngẫu nhiên).
- `JWT_EXPIRES_IN`: thời gian hết hạn token (ví dụ: `7d`).
- `CORS_ORIGIN` (tuỳ chọn): origin cho Socket.IO CORS (ví dụ `http://localhost:3000`).

### 1) Backend

```bash
npm install
npm run dev
```

Backend chạy tại **http://localhost:5000**.

### 2) Frontend

```bash
npm install
npm run dev
```

Frontend chạy tại **http://localhost:3000**.

Vite dev server proxy:

- `/api` -> `http://localhost:5000`
- `/socket.io` -> `http://localhost:5000`
- `/uploads` -> `http://localhost:5000`

## Ghi chú

- Ảnh upload sẽ trả về dạng `/uploads/<filename>` và có thể dùng trực tiếp ở frontend.
- Nếu thay đổi biến môi trường, hãy restart backend.
- swagger api