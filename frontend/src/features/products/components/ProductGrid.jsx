function ProductGrid({ products, loading, onProductClick, availabilityByProductId }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Đang tải sản phẩm...</div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="text-gray-500 text-lg mb-2">
                    Không tìm thấy sản phẩm
                </div>
            </div>
        );
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " VND";
    };

    return (
        <div className="grid grid-cols-[repeat(auto-fill,150px)] justify-between gap-y-3 content-start">
            {products.map((product) => {
                const pid = product?._id;
                const avail = pid ? availabilityByProductId?.[pid] : null;
                const disabled = avail ? avail.canAdd === false : false;
                return (
                <button
                    type="button"
                    key={product._id}
                    disabled={disabled}
                    onClick={() => onProductClick(product)}
                    className={`group w-[150px] bg-gray-50 rounded-lg border border-gray-300 overflow-hidden transition-colors text-left ${
                        disabled ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        <img
                            src={
                                product.image ||
                                "https://via.placeholder.com/200"
                            }
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.src =
                                    "https://via.placeholder.com/200";
                            }}
                        />

                        {disabled && (
                            <div className="absolute inset-0">
                                <div className="absolute inset-0 bg-white/55" />
                                <div className="absolute inset-0 flex items-center justify-center px-3">
                                    <div className="text-center text-2xl font-semibold text-gray-900">
                                        Nguyên liệu tạm hết
                                    </div>
                                </div>
                                <div className="absolute left-[-50%] top-1/2 w-[200%] h-[3px] bg-black/40 -rotate-45" />
                            </div>
                        )}
                    </div>
                    <div className="p-2.5">
                        <div className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.1rem]">
                            {product.name}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">
                                {formatPrice(product.price)}
                            </span>
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onProductClick(product);
                                }}
                                className={`h-7 w-7 rounded-full border border-gray-300 bg-white text-gray-900 inline-flex items-center justify-center transition-colors ${
                                    disabled ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                title="Thêm vào giỏ"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-4 h-4"
                                    aria-hidden="true"
                                >
                                    <path d="M12 5v14" />
                                    <path d="M5 12h14" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </button>
                );
            })}
        </div>
    );
}

export default ProductGrid;
