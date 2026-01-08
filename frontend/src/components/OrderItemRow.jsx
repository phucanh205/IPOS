import { useState, useRef, useEffect } from "react";

function OrderItemRow({ item, onClick, onIncreaseQty, onDecreaseQty, onDelete }) {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [showDelete, setShowDelete] = useState(false);
    const itemRef = useRef(null);

    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN").format(price) + " VND";

    const toppingsText =
        item.toppings && item.toppings.length > 0
            ? item.toppings.join(", ")
            : null;

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setStartX(e.touches[0].clientX);
        setSwipeOffset(0);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        
        // Chỉ cho phép kéo từ phải sang trái (diff < 0)
        if (diff < 0) {
            const maxSwipe = -80; // Kéo tối đa 80px
            setSwipeOffset(Math.max(diff, maxSwipe));
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        
        // Nếu kéo đủ xa (từ 40px trở đi) thì hiển thị nút xóa
        if (swipeOffset < -40) {
            setShowDelete(true);
            setSwipeOffset(-80);
        } else {
            setShowDelete(false);
            setSwipeOffset(0);
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete();
    };

    const handleItemClick = () => {
        if (!showDelete) {
            onClick();
        }
    };

    const resetSwipe = () => {
        setShowDelete(false);
        setSwipeOffset(0);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (itemRef.current && !itemRef.current.contains(event.target)) {
                resetSwipe();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative overflow-hidden" ref={itemRef}>
            {/* Nút xóa */}
            <div 
                className={`absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center transition-all duration-300 z-10 ${
                    showDelete ? 'opacity-100' : 'opacity-0'
                }`}
            >
                <button
                    onClick={handleDeleteClick}
                    className="text-white font-semibold text-lg"
                >
                    Xóa
                </button>
            </div>

            {/* Item content */}
            <button
                type="button"
                onClick={handleItemClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 border border-transparent hover:border-blue-400 hover:shadow-sm text-left transition-all relative"
                style={{
                    transform: `translateX(${swipeOffset}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                }}
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
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                    >
                        -
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onIncreaseQty();
                        }}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                    >
                        +
                    </button>
                </div>
            </button>
        </div>
    );
}

export default OrderItemRow;
