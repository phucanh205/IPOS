const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(Number(price) || 0) + " VND";

function ProductDetailModal({ open, product, onClose, onEdit, onDelete }) {
    if (!open || !product) return null;

    const tags = product.tags || [];

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">
                            {product.name}
                        </h3>
                        <div className="text-sm font-semibold text-gray-800 mt-1">
                            {formatPrice(product.price)}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 text-xl"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="px-6 py-4 space-y-3 text-sm">
                    <div className="flex gap-3">
                        <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            <img
                                src={
                                    product.image ||
                                    "https://via.placeholder.com/100"
                                }
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="text-xs text-gray-500">
                                <span className="font-semibold">Danh mục</span>{" "}
                                <span className="ml-1 text-gray-700">
                                    {product.category?.name ||
                                        product.categoryName ||
                                        "—"}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500">
                                <span className="font-semibold">SKU / Mã</span>{" "}
                                <span className="ml-1 text-gray-700">
                                    {product.sku || product.barcode || "—"}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500">
                                <span className="font-semibold">Hiển thị</span>{" "}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {tags.length > 0 ? (
                                    tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-blue-600 font-medium"
                                        >
                                            {tag}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[11px] text-gray-400">
                                        Không có tag
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-gray-600 mt-2">
                        {product.description ||
                            "Juicy grilled beef patty, double cheese, fresh lettuce, tomato and house special sauce."}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex gap-3 text-sm">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        Chỉnh sửa
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
                    >
                        Xóa món
                    </button>
                </div>

                <div className="px-6 pb-4 text-[11px] text-gray-400">
                    Khi ấn &quot;Chỉnh sửa&quot;, dùng lại form Upload Food ở
                    bên phải để cập nhật sản phẩm này.
                </div>
            </div>
        </div>
    );
}

export default ProductDetailModal;
