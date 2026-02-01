function HoldOrderSuccessModal({ open, orderNumber, onClose, onStartNew }) {
    if (!open) return null;

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
                        Tạm giữ đơn hàng thành công
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {orderNumber} đã được tạm giữ.
                    </p>

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

export default HoldOrderSuccessModal;
