import { useState, useRef } from "react";
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
    tableNumber = "Bàn 4",
    paymentMethod = "Cash",
    onPaymentMethodChange,
}) {
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        itemToDelete: null,
    });

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
        <div className="w-full lg:w-96 xl:w-[420px] bg-slate-50 border-l border-gray-200 h-full flex flex-col rounded-3xl lg:rounded-none lg:rounded-l-3xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-400">{tableNumber}</div>
                    <div className="text-xs text-gray-400 mt-1">
                        {items.length} món
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
                    title="Đóng và hủy order"
                >
                    ×
                </button>
            </div>

            {/* Dine in / Take away / Delivery */}
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
            <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-2">
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
                <div className="flex gap-3 text-sm">
                    <button
                        onClick={handleHoldOrder}
                        disabled={items.length === 0}
                        className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Tạm giữ
                    </button>
                    <button
                        onClick={handlePlaceOrder}
                        disabled={items.length === 0}
                        className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Thanh toán
                    </button>
                </div>
            </div>

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Xác nhận xóa sản phẩm
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Bạn có chắc chắn muốn xóa "{deleteModal.itemToDelete?.product?.name}" khỏi giỏ hàng không?
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancelDelete}
                            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
                        >
                            Xác nhận
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}

export default OrderPanel;
