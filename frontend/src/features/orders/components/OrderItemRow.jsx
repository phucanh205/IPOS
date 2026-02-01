function OrderItemRow({ item, onClick, onIncreaseQty, onDecreaseQty, onDelete }) {
    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN").format(price) + " VND";

    const optionParts = [];
    if (item.sizeLabel && item.sizeLabel !== "Vừa") {
        optionParts.push(item.sizeLabel);
    }
    if (Array.isArray(item.toppings) && item.toppings.length > 0) {
        optionParts.push(item.toppings.join(", "));
    }
    if (item.notes) {
        optionParts.push(item.notes);
    }

    const optionsText = optionParts.join(" • ");

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete();
    };

    return (
        <div className="relative">
            {/* Nút xóa ở góc trên phải */}
            <button
                onClick={handleDeleteClick}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors z-10 shadow-md"
            >
                ×
            </button>

            {/* Item content */}
            <div
                onClick={onClick}
                className="w-full flex items-start gap-4 bg-white rounded-2xl p-4 border border-gray-200 shadow-sm text-left transition-colors cursor-pointer pr-6"
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                        <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                            {item.product.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {optionsText || `${item.quantity}x`}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="mt-0.5 text-base font-bold text-emerald-600 whitespace-nowrap">
                        {formatPrice(item.totalPrice)}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                            SL: {item.quantity}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDecreaseQty();
                                }}
                                className="w-7 h-7 rounded-full border border-gray-300 bg-white text-gray-700 inline-flex items-center justify-center"
                                aria-label="Giảm số lượng"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                >
                                    <path d="M5 12h14" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onIncreaseQty();
                                }}
                                className="w-7 h-7 rounded-full border border-gray-300 bg-white text-gray-700 inline-flex items-center justify-center"
                                aria-label="Tăng số lượng"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-3.5 h-3.5"
                                    aria-hidden="true"
                                >
                                    <path d="M12 5v14" />
                                    <path d="M5 12h14" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderItemRow;
