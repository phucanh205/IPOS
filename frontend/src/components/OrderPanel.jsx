import { useState } from "react";
import OrderItemRow from "./OrderItemRow";

function OrderPanel({
    items,
    onItemClick,
    onIncreaseQty,
    onDecreaseQty,
    onRemoveItem,
    onClose,
    onHoldOrder,
    onPlaceOrder,
    orderType = "Dine in",
    onOrderTypeChange,
    tableNumber = "Bàn 1",
    onTableNumberChange,
    paymentMethod = "Cash",
    onPaymentMethodChange,
}) {
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        itemToDelete: null,
    });

    const isCartEmpty = items.length === 0;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = Math.round(subtotal * 0.1); // 10% tax như trong hình
    const total = subtotal + tax;

    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN").format(price) + " VND";

    const handleHoldOrder = () => {
        if (items.length === 0) {
            alert("Vui lòng thêm ít nhất 1 sản phẩm vào đơn hàng");
            return;
        }
        if (onHoldOrder) {
            onHoldOrder({
                tableNumber,
                orderType,
                items,
                subtotal,
                tax,
                total,
            });
        }
    };

    const handlePlaceOrder = () => {
        if (items.length === 0) {
            alert("Vui lòng thêm ít nhất 1 sản phẩm vào đơn hàng");
            return;
        }
        if (onPlaceOrder) {
            onPlaceOrder({
                tableNumber,
                orderType,
                paymentMethod,
                items,
                subtotal,
                tax,
                total,
                totalPaid: total, // Mặc định trả đúng số tiền
                changeDue: 0, // Mặc định không có tiền thừa
            });
        }
    };

    const handleDeleteClick = (item) => {
        setDeleteModal({
            isOpen: true,
            itemToDelete: item,
        });
    };

    const handleConfirmDelete = () => {
        if (deleteModal.itemToDelete && onRemoveItem) {
            onRemoveItem(deleteModal.itemToDelete.id);
        }
        setDeleteModal({
            isOpen: false,
            itemToDelete: null,
        });
    };

    const handleCancelDelete = () => {
        setDeleteModal({
            isOpen: false,
            itemToDelete: null,
        });
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-white rounded-2xl shadow-2xl ring-2 ring-gray-300 border-2 border-gray-200">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                {/* Table Selection - chỉ hiển thị khi orderType là "Dine in" */}
                {orderType === "Dine in" ? (
                    <div className="flex items-center justify-between mb-3">
                        <select
                            value={tableNumber}
                            onChange={(e) => onTableNumberChange?.(e.target.value)}
                            className="text-sm text-gray-900 bg-transparent border-none focus:outline-none cursor-pointer font-medium"
                        >
                            <option value="Bàn 1">Bàn 1</option>
                            <option value="Bàn 2">Bàn 2</option>
                            <option value="Bàn 3">Bàn 3</option>
                            <option value="Bàn 4">Bàn 4</option>
                            <option value="Bàn 5">Bàn 5</option>
                            <option value="Bàn 6">Bàn 6</option>
                            <option value="Bàn 7">Bàn 7</option>
                            <option value="Bàn 8">Bàn 8</option>
                            <option value="Bàn 9">Bàn 9</option>
                            <option value="Bàn 10">Bàn 10</option>
                        </select>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
                            title="Đóng và hủy order"
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-900 font-medium">
                            {orderType === "Take away" ? "Mang đi" : "Giao hàng"}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
                            title="Đóng và hủy order"
                        >
                            ×
                        </button>
                    </div>
                )}
                <div className="text-xs text-gray-900">
                    {totalItems} món
                </div>
            </div>

            {/* Order Type */}
            <div className="px-6 pt-4">
                <div className="bg-slate-100 rounded-full p-1 flex text-xs font-medium">
                    <button
                        onClick={() => onOrderTypeChange?.("Dine in")}
                        className={`flex-1 py-1.5 rounded-full ${
                            orderType === "Dine in"
                                ? "bg-white shadow text-gray-900"
                                : "text-gray-500"
                        }`}
                    >
                        Tại bàn
                    </button>
                    <button
                        onClick={() => onOrderTypeChange?.("Take away")}
                        className={`flex-1 py-1.5 rounded-full ${
                            orderType === "Take away"
                                ? "bg-white shadow text-gray-900"
                                : "text-gray-500"
                        }`}
                    >
                        Mang đi
                    </button>
                    <button
                        onClick={() => onOrderTypeChange?.("Delivery")}
                        className={`flex-1 py-1.5 rounded-full ${
                            orderType === "Delivery"
                                ? "bg-white shadow text-gray-900"
                                : "text-gray-500"
                        }`}
                    >
                        Giao hàng
                    </button>
                </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-3 pt-4 space-y-3">
                {items.map((item) => (
                    <OrderItemRow
                        key={item.id}
                        item={item}
                        onClick={() => onItemClick(item)}
                        onIncreaseQty={() => onIncreaseQty(item.id)}
                        onDecreaseQty={() => onDecreaseQty(item.id)}
                        onDelete={() => handleDeleteClick(item)}
                    />
                ))}
                {items.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        Chọn sản phẩm bên trái để thêm vào bill
                    </div>
                )}
            </div>

            {/* Totals */}
            <div className="px-6 py-4 border-t border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                    <span>Tạm tính</span>
                    <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                    <span>Thuế (10%)</span>
                    <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-800 font-semibold pt-1 border-t border-gray-100 mt-1">
                    <span>Tổng tiền</span>
                    <span>{formatPrice(total)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                    <button
                        onClick={() => onPaymentMethodChange?.("Cash")}
                        className={`flex flex-col items-center justify-center py-2 rounded-xl border ${
                            paymentMethod === "Cash"
                                ? "bg-blue-50 border-blue-400 text-blue-700"
                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <span>Tiền mặt</span>
                    </button>
                    <button
                        onClick={() => onPaymentMethodChange?.("Card")}
                        className={`flex flex-col items-center justify-center py-2 rounded-xl border ${
                            paymentMethod === "Card"
                                ? "bg-blue-50 border-blue-400 text-blue-700"
                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <span>Thẻ</span>
                    </button>
                    <button
                        onClick={() => onPaymentMethodChange?.("QR Code")}
                        className={`flex flex-col items-center justify-center py-2 rounded-xl border ${
                            paymentMethod === "QR Code"
                                ? "bg-blue-50 border-blue-400 text-blue-700"
                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <span>QR Code</span>
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleHoldOrder}
                        disabled={isCartEmpty}
                        title={
                            isCartEmpty
                                ? "Giỏ hàng đang trống"
                                : "Giữ đơn"
                        }
                        className={`py-3 px-4 rounded-xl font-medium border transition-colors ${
                            isCartEmpty
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        Giữ đơn
                    </button>
                    <button
                        onClick={handlePlaceOrder}
                        disabled={isCartEmpty}
                        title={
                            isCartEmpty
                                ? "Giỏ hàng đang trống"
                                : "Thanh toán"
                        }
                        className={`py-3 px-4 rounded-xl font-semibold transition-colors ${
                            isCartEmpty
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                    >
                        Thanh toán
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
                        {/* Icon thùng rác */}
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Nội dung */}
                        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                            Xác nhận xóa
                        </h3>
                        <p className="text-gray-600 text-center mb-2">
                            Bạn chắc chắn muốn xóa món này không?
                        </p>
                        <p className="text-red-600 text-sm text-center mb-6">
                            Hành động này không thể hoàn tác.
                        </p>

                        {/* Nút */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelDelete}
                                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderPanel;
