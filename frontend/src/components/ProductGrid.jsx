function ProductGrid({ products, loading, onProductClick }) {
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
                <div className="text-gray-400 text-sm">
                    Vui lòng kiểm tra kết nối backend hoặc thử lại sau.
                </div>
            </div>
        );
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " VND";
    };

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 content-start">
            {products.map((product) => (
                <button
                    type="button"
                    key={product._id}
                    onClick={() => onProductClick(product)}
                    className="group bg-gray-50 rounded-lg border border-gray-300 overflow-hidden transition-colors text-left"
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
                    </div>
                    <div className="p-3">
                        <div className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.25rem]">
                            {product.name}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">
                                {formatPrice(product.price)}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onProductClick(product);
                                }}
                                className="h-8 w-8 rounded-full border border-gray-200 bg-white text-gray-900 flex items-center justify-center group-hover:border-gray-300 group-hover:bg-white transition-colors"
                                title="Thêm vào giỏ"
                            >
                                <span className="text-base leading-none">+</span>
                            </button>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}

export default ProductGrid;
