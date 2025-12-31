function PaymentSuccessModal({
    open,
    orderNumber,
    subtotal,
    tax,
    totalPaid,
    changeDue,
    onClose,
    onStartNew,
}) {
    if (!open) return null;

    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN").format(price || 0) + " VND";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="px-8 py-10 text-center">
                    {/* Success Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                            <svg
                                className="w-12 h-12 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Thanh toán thành công
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {orderNumber} đã được đặt hàng.
                    </p>

                    {/* Transaction Summary */}
                    <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-3 text-sm">
                        <div className="flex justify-between text-gray-700">
                            <span>Tạm tính</span>
                            <span className="font-medium">
                                {formatPrice(subtotal)}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                            <span>Thuế (10%)</span>
                            <span className="font-medium">
                                {formatPrice(tax)}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-900 font-semibold pt-2 border-t border-gray-200">
                            <span>Tổng thanh toán</span>
                            <span>{formatPrice(totalPaid)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                            <span>Tiền thừa</span>
                            <span className="font-medium">
                                {formatPrice(changeDue)}
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={onStartNew}
                        className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-semibold text-base hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">+</span>
                        <span>Tạo đơn hàng mới</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PaymentSuccessModal;
