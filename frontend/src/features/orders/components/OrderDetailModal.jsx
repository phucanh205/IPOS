function OrderDetailModal({ open, order, onClose }) {
    if (!open || !order) return null;

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price || 0);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return `${day} Thg ${month}, ${hours
            .toString()
            .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    };

    const getOrderTypeText = (orderType) => {
        const types = {
            "Dine in": "Tại bàn",
            "Take away": "Mang đi",
            Delivery: "Giao hàng",
        };
        return types[orderType] || orderType;
    };

    const getPaymentMethodText = (paymentMethod) => {
        const methods = {
            Cash: "Tiền mặt",
            Card: "Thẻ tín dụng",
            "QR Code": "Online",
        };
        return methods[paymentMethod] || paymentMethod;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-sm text-gray-500 mb-3">
                        Chi tiết hóa đơn
                    </h2>
                    <div className="px-4 py-3 border-2 border-blue-500 rounded-lg bg-blue-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-lg font-bold text-gray-900">
                                {order.orderNumber}
                            </div>
                            <div className="text-sm text-gray-600">
                                {formatDate(order.createdAt)}
                            </div>
                            <div className="flex gap-2">
                                <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium">
                                    Đã thanh toán
                                </span>
                                <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium">
                                    {getOrderTypeText(order.orderType)} -{" "}
                                    {order.tableNumber}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors text-xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* TỔNG QUAN */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                TỔNG QUAN
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Mã đơn:
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {order.orderNumber}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Ngày & giờ:
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {formatDate(order.createdAt)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Loại đơn:
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {getOrderTypeText(order.orderType)} (
                                        {order.tableNumber})
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Khách hàng:
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        Khách lẻ
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* TỔNG TIỀN */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                TỔNG TIỀN
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Tạm tính:
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {formatPrice(order.subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Thuế (10%):
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {formatPrice(order.tax)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Giảm giá:
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        0
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-300">
                                    <span className="font-semibold text-gray-900">
                                        Tổng thanh toán:
                                    </span>
                                    <span className="font-bold text-gray-900">
                                        {formatPrice(order.total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* DANH SÁCH MÓN */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                DANH SÁCH MÓN
                            </h3>
                            <div className="space-y-4">
                                {order.items.map((item, index) => (
                                    <div key={index} className="text-sm">
                                        <div className="font-medium text-gray-900 mb-1">
                                            {item.productName}
                                        </div>
                                        {item.notes && (
                                            <div className="text-gray-600 text-xs mb-1">
                                                Ghi chú: {item.notes}
                                            </div>
                                        )}
                                        {item.sizeLabel && (
                                            <div className="text-gray-600 text-xs mb-1">
                                                Size {item.sizeLabel}
                                            </div>
                                        )}
                                        {item.toppings &&
                                            item.toppings.length > 0 && (
                                                <div className="text-gray-600 text-xs mb-1">
                                                    {item.toppings.join(", ")}
                                                </div>
                                            )}
                                        <div className="flex justify-between mt-2">
                                            <span className="text-gray-600">
                                                SL: {item.quantity}
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                Thành tiền:{" "}
                                                {formatPrice(item.totalPrice)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* THANH TOÁN */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                THANH TOÁN
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Hình thức thanh toán:
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {getPaymentMethodText(
                                            order.paymentMethod
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Thời gian thanh toán:
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {formatDate(order.createdAt)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Mã giao dịch:
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        TXN-{order._id.slice(-5).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        Ấn "In hóa đơn" để in lại, hoặc "Đóng" để quay lại danh
                        sách.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm flex items-center gap-2"
                        >
                            <span>×</span>
                            <span>Đóng</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderDetailModal;
