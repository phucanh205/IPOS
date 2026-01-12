function OrderItemRow({ item, onClick, onIncreaseQty, onDecreaseQty, onDelete }) {
    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN").format(price) + " VND";

    const toppingsText =
        item.toppings && item.toppings.length > 0
            ? item.toppings.join(", ")
            : null;

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
                className="w-full flex items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-300 text-left transition-colors cursor-pointer pr-12"
            >
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {item.product.name}
                    </h4>
                    <div className="mt-1 text-xs text-gray-500 truncate">
                        {item.quantity}x{toppingsText && ` • ${toppingsText}`}
                        {item.notes && ` • ${item.notes}`}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="text-sm font-semibold text-emerald-600 whitespace-nowrap">
                        {formatPrice(item.totalPrice)}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDecreaseQty();
                            }}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 bg-white shadow-sm"
                        >
                            -
                        </button>
                        <span className="text-xs font-semibold text-gray-700 min-w-7 text-center">
                            {item.quantity}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onIncreaseQty();
                            }}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 bg-white shadow-sm"
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderItemRow;
