import { useState } from "react";

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
                className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 border border-transparent hover:border-blue-400 hover:shadow-sm text-left transition-all cursor-pointer pr-8"
            >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-gray-800 truncate">
                            {item.product.name}
                        </h4>
                        <span className="text-sm font-semibold text-emerald-600 ml-2 whitespace-nowrap">
                            {formatPrice(item.totalPrice)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                        <span className="truncate">
                            {item.quantity}x{toppingsText && ` • ${toppingsText}`}
                            {item.notes && ` • ${item.notes}`}
                        </span>
                        <span className="whitespace-nowrap ml-2">
                            SL: {item.quantity}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDecreaseQty();
                        }}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 bg-white shadow-sm"
                    >
                        -
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onIncreaseQty();
                        }}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 bg-white shadow-sm"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
}

export default OrderItemRow;
