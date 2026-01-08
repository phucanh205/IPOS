import { useEffect, useState, useRef } from "react";
import { uploadImage } from "../services/api";

function ProductFormModal({ open, categories, initialData, onClose, onSave }) {
    const [name, setName] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [price, setPrice] = useState(0);
    const [sku, setSku] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState([]);
    const [showOnPos, setShowOnPos] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageUrl, setImageUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setName(initialData?.name || "");
            setCategoryId(initialData?.categoryId || "");
            setPrice(initialData?.price || 0);
            setSku(initialData?.sku || "");
            setDescription(initialData?.description || "");
            setTags(initialData?.tags || []);
            setShowOnPos(initialData?.showOnPos ?? true);
            setImageUrl(initialData?.image || "");
            setImagePreview(initialData?.image || null);
            setErrors({});
        }
    }, [open, initialData]);

    if (!open) return null;

    const toggleTag = (tag) => {
        setTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
            alert("Vui lòng chọn file ảnh (JPEG, PNG, GIF, WEBP)");
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("Kích thước file không được vượt quá 5MB");
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload image
        setUploading(true);
        try {
            const response = await uploadImage(file);
            setImageUrl(response.url);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Lỗi khi upload ảnh. Vui lòng thử lại.");
            setImagePreview(null);
        } finally {
            setUploading(false);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!name.trim()) {
            newErrors.name = "Vui lòng nhập tên món ăn";
        }
        
        if (!categoryId) {
            newErrors.categoryId = "Vui lòng chọn danh mục";
        }
        
        if (!price || price <= 0) {
            newErrors.price = "Vui lòng nhập giá lớn hơn 0";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        const category = categories.find((c) => c._id === categoryId);
        onSave({
            name,
            price: Number(price) || 0,
            categoryId,
            categoryName: category?.name,
            sku,
            description,
            tags,
            showOnPos,
            image:
                imageUrl ||
                "https://via.placeholder.com/400x300?text=Food+Image",
        });
    };

    const formatPrice = (value) =>
        new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + " VND";

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">
                        {initialData ? "Chỉnh sửa món ăn" : "Thêm món ăn mới"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl"
                    >
                        ×
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex-1 flex overflow-hidden"
                >
                    {/* Left: form */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 border-r border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">
                            Thông tin cơ bản
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="block text-gray-600 mb-1">
                                    Tên món ăn
                                </label>
                                <input
                                    type="text"
                                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.name ? "border-red-500" : "border-gray-300"
                                    }`}
                                    placeholder="Ví dụ: Burger bò phô mai"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (errors.name) {
                                            setErrors({ ...errors, name: "" });
                                        }
                                    }}
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-gray-600 mb-1">
                                        Danh mục
                                    </label>
                                    <select
                                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.categoryId ? "border-red-500" : "border-gray-300"
                                        }`}
                                        value={categoryId}
                                        onChange={(e) => {
                                            setCategoryId(e.target.value);
                                            if (errors.categoryId) {
                                                setErrors({ ...errors, categoryId: "" });
                                            }
                                        }}
                                    >
                                        <option value="">Chọn danh mục</option>
                                        {categories
                                            .filter((c) => c._id !== "all")
                                            .map((c) => (
                                                <option
                                                    key={c._id}
                                                    value={c._id}
                                                >
                                                    {c.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-600 mb-1">
                                        Giá
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                errors.price ? "border-red-500" : "border-gray-300"
                                            }`}
                                            value={price}
                                            onChange={(e) => {
                                                setPrice(e.target.value);
                                                if (errors.price) {
                                                    setErrors({ ...errors, price: "" });
                                                }
                                            }}
                                        />
                                        <span className="text-gray-500 text-xs">
                                            VND
                                        </span>
                                    </div>
                                    {errors.price && (
                                        <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-gray-600 mb-1">
                                        SKU / Mã (tùy chọn)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Quét hoặc nhập mã sản phẩm"
                                        value={sku}
                                        onChange={(e) => setSku(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-600 mb-1">
                                    Mô tả
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Mô tả ngắn xuất hiện ở đây để nhân viên có thể xác nhận nhanh."
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 mb-1">
                                    Tag & hiển thị
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {[
                                        "Phổ biến",
                                        "Mới",
                                        "Cay",
                                        "Chay",
                                        "Bán chạy",
                                    ].map((tag) => {
                                        const active = tags.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleTag(tag)}
                                                className={`px-3 py-1 rounded-full text-xs border ${
                                                    active
                                                        ? "bg-blue-50 text-blue-600 border-blue-400"
                                                        : "bg-white text-gray-600 border-gray-300"
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>
                                <label className="inline-flex items-center gap-2 text-xs text-gray-600 mt-1">
                                    <input
                                        type="checkbox"
                                        checked={showOnPos}
                                        onChange={(e) =>
                                            setShowOnPos(e.target.checked)
                                        }
                                        className="rounded border-gray-300 text-blue-600"
                                    />
                                    <span>Hiển thị trên trang chủ POS</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right: preview */}
                    <div className="w-full max-w-sm bg-slate-50 p-6 flex flex-col border-l border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">
                            Xem trước
                        </h3>
                        <div
                            onClick={handleImageClick}
                            className="bg-white rounded-3xl shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center py-8 mb-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors relative"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            {uploading ? (
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                    <span className="text-xs text-gray-500">
                                        Đang upload...
                                    </span>
                                </div>
                            ) : imagePreview ? (
                                <div className="w-full h-48 rounded-2xl overflow-hidden">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <>
                                    <span className="text-gray-400 text-3xl mb-2">
                                        ⬆️
                                    </span>
                                    <span className="text-xs text-gray-500 text-center max-w-[200px]">
                                        Tải ảnh lên để thay thế placeholder này
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-4">
                            <div className="h-32 bg-gray-100 overflow-hidden">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt={name || "Product"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                                )}
                            </div>
                            <div className="p-3 text-xs">
                                <div className="font-semibold text-gray-800 truncate">
                                    {name || "Classic Cheeseburger"}
                                </div>
                                <div className="text-gray-500 mt-1">
                                    {description ||
                                        "Short description appears here…"}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-gray-600"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-2 font-semibold text-blue-600">
                                    {formatPrice(price)}
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto flex justify-end gap-2 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Đặt lại
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                            >
                                Lưu món
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProductFormModal;
