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
                    Vui lòng kiểm tra kết nối backend hoặc chạy seed script
                </div>
            </div>
        );
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " VND";
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {products.map((product) => (
                <button
                    type="button"
                    key={product._id}
                    onClick={() => onProductClick(product)}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow text-left"
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
                    <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                            {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-900">
                                {formatPrice(product.price)}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onProductClick(product);
                                }}
                                className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                            >
                                <span className="text-xl font-bold">+</span>
                            </button>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}

export default ProductGrid;
