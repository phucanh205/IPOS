import { useEffect, useMemo, useState } from "react";
import Sidebar from "@shared/components/Sidebar";
import SearchBar from "@shared/components/SearchBar";
import CategoryFilters from "@features/products/components/CategoryFilters";
import DateTimeDisplay from "@shared/components/DateTimeDisplay";
import ProductFormModal from "@features/products/components/ProductFormModal";
import ProductDetailModal from "@features/products/components/ProductDetailModal";
import DeleteConfirmModal from "@shared/components/DeleteConfirmModal";
import { useAuth } from "@features/auth/context/AuthContext";
import {
    getProducts,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    deleteProduct,
} from "@shared/api/apiClient";

function Products() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    const [localProducts, setLocalProducts] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [detailProduct, setDetailProduct] = useState(null);
    const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);

    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [categoryDraft, setCategoryDraft] = useState([]);
    const [categoryNewName, setCategoryNewName] = useState("");
    const [categoryDeletedIds, setCategoryDeletedIds] = useState([]);
    const [categoryOriginalNames, setCategoryOriginalNames] = useState({});
    const [categorySaving, setCategorySaving] = useState(false);

    useEffect(() => {
        loadCategories();
        loadProducts();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories([
                { name: "Tất cả", slug: "all", _id: "all" },
                ...data,
            ]);
        } catch (error) {
            console.error("Error loading categories:", error);
            setCategories([{ name: "Tất cả", slug: "all", _id: "all" }]);
        }
    };

    const openCategoryModal = () => {
        const real = (categories || []).filter((c) => c?._id && c._id !== "all");
        const originalMap = real.reduce((acc, c) => {
            acc[c._id] = c?.name || "";
            return acc;
        }, {});
        setCategoryOriginalNames(originalMap);
        setCategoryDraft(real.map((c) => ({ _id: c._id, name: c?.name || "" })));
        setCategoryNewName("");
        setCategoryDeletedIds([]);
        setCategoryModalOpen(true);
    };

    const closeCategoryModal = () => {
        if (categorySaving) return;
        setCategoryModalOpen(false);
    };

    const updateDraftName = (id, name) => {
        setCategoryDraft((prev) =>
            prev.map((c) => (c._id === id ? { ...c, name } : c))
        );
    };

    const removeDraftCategory = (id) => {
        setCategoryDraft((prev) => prev.filter((c) => c._id !== id));
        if (id && !String(id).startsWith("tmp_")) {
            setCategoryDeletedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        }
    };

    const addDraftCategory = () => {
        const name = String(categoryNewName || "").trim();
        if (!name) return;
        const tmpId = `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        setCategoryDraft((prev) => [...prev, { _id: tmpId, name }]);
        setCategoryNewName("");
    };

    const saveCategoryChanges = async () => {
        if (categorySaving) return;
        setCategorySaving(true);

        try {
            const normalized = (categoryDraft || [])
                .map((c) => ({ ...c, name: String(c?.name || "").trim() }))
                .filter((c) => c.name);

            const hasDuplicate = (() => {
                const seen = new Set();
                for (const c of normalized) {
                    const key = c.name.toLowerCase();
                    if (seen.has(key)) return true;
                    seen.add(key);
                }
                return false;
            })();

            if (hasDuplicate) {
                alert("Tên danh mục bị trùng. Vui lòng kiểm tra lại.");
                return;
            }

            for (const id of categoryDeletedIds) {
                await deleteCategory(id);
            }

            for (const c of normalized) {
                const isTemp = String(c._id || "").startsWith("tmp_");
                if (isTemp) continue;
                const before = categoryOriginalNames?.[c._id] ?? "";
                if (String(before).trim() !== c.name) {
                    await updateCategory(c._id, { name: c.name });
                }
            }

            for (const c of normalized) {
                const isTemp = String(c._id || "").startsWith("tmp_");
                if (!isTemp) continue;
                await createCategory({ name: c.name });
            }

            if (String(categoryNewName || "").trim()) {
                await createCategory({ name: String(categoryNewName).trim() });
                setCategoryNewName("");
            }

            await loadCategories();

            if (categoryDeletedIds.includes(selectedCategory)) {
                setSelectedCategory("all");
            }

            setCategoryModalOpen(false);
        } catch (error) {
            console.error("Error saving categories:", error);
            alert(
                "Lỗi khi lưu danh mục: " +
                    (error.response?.data?.error || error.message)
            );
        } finally {
            setCategorySaving(false);
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            setProducts(data || []);
        } catch (error) {
            console.error("Error loading products:", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const allProducts = useMemo(
        () => [...products, ...localProducts],
        [products, localProducts]
    );

    const filteredProducts = allProducts.filter((product) => {
        const matchCategory =
            selectedCategory === "all" ||
            product.category?._id === selectedCategory ||
            product.categorySlug === selectedCategory;
        const matchSearch =
            !searchQuery ||
            product.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const handleOpenNew = () => {
        setEditingProduct(null);
        setIsFormOpen(true);
    };

    const handleSaveProduct = async (data) => {
        try {
            if (editingProduct && !editingProduct.isLocal) {
                // Update existing product in database
                const updatedProduct = await updateProduct(editingProduct.id, {
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    image: data.image,
                    categoryId: data.categoryId,
                    barcode: data.sku,
                });
                // Reload products to get updated data
                await loadProducts();
            } else if (editingProduct && editingProduct.isLocal) {
                // Update local product (shouldn't happen often, but handle it)
                setLocalProducts((prev) =>
                    prev.map((p) =>
                        p.id === editingProduct.id ? { ...p, ...data } : p
                    )
                );
            } else {
                // Create new product in database
                await createProduct({
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    image: data.image,
                    categoryId: data.categoryId,
                    barcode: data.sku,
                });
                // Reload products to get new data
                await loadProducts();
            }
            setIsFormOpen(false);
        } catch (error) {
            console.error("Error saving product:", error);
            alert(
                "Lỗi khi lưu sản phẩm: " +
                    (error.response?.data?.error || error.message)
            );
        }
    };

    const handleOpenDetail = (product) => {
        setDetailProduct(product);
    };

    const handleEditFromDetail = () => {
        if (!detailProduct) return;

        // Close detail modal first
        const productToEdit = detailProduct;
        setDetailProduct(null);

        // Then open edit modal
        if (productToEdit.isLocal) {
            setEditingProduct(productToEdit);
        } else {
            // Convert API product to local edit model
            setEditingProduct({
                id: productToEdit._id,
                name: productToEdit.name,
                price: productToEdit.price,
                categoryId: productToEdit.category?._id,
                categoryName: productToEdit.category?.name,
                sku: productToEdit.barcode || "",
                description: productToEdit.description || "",
                tags: [],
                showOnPos: true,
                image: productToEdit.image,
                isLocal: false,
            });
        }
        setIsFormOpen(true);
    };

    const handleDeleteFromDetail = () => {
        if (!detailProduct) return;

        // Close detail modal and open delete confirm modal
        const productToDelete = detailProduct;
        setDetailProduct(null);
        setDeleteConfirmProduct(productToDelete);
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmProduct) return;

        try {
            if (deleteConfirmProduct.isLocal) {
                setLocalProducts((prev) =>
                    prev.filter((p) => p.id !== deleteConfirmProduct.id)
                );
            } else {
                await deleteProduct(deleteConfirmProduct._id);
                await loadProducts();
            }
            setDeleteConfirmProduct(null);
        } catch (error) {
            console.error("Error deleting product:", error);
            alert(
                "Lỗi khi xóa sản phẩm: " +
                    (error.response?.data?.error || error.message)
            );
        }
    };

    return (
        <>
            <div className="flex h-screen bg-gray-100">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Search and Filter Bar */}
                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <SearchBar onSearch={handleSearch} />
                                <CategoryFilters
                                    categories={categories}
                                    selectedCategory={selectedCategory}
                                    onCategoryChange={handleCategoryChange}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={openCategoryModal}
                                        className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <span className="text-xl leading-none">+</span>
                                        <span className="font-medium">Thêm danh mục</span>
                                    </button>
                                )}
                                <DateTimeDisplay />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {/* Add new food card */}
                        <button
                            type="button"
                            onClick={handleOpenNew}
                            className="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border border-dashed border-gray-300 hover:border-blue-400 hover:shadow-md transition-all py-6"
                        >
                            <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-4xl mb-3">
                                +
                            </div>
                            <div className="text-gray-700 text-sm font-medium">
                                Thêm món ăn mới
                            </div>
                        </button>

                        {/* Product cards */}
                        {loading ? (
                            <div className="col-span-full flex items-center justify-center py-16 text-gray-400">
                                Đang tải sản phẩm...
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400 text-sm">
                                Không có sản phẩm nào
                            </div>
                        ) : (
                            filteredProducts.map((product) => (
                                <button
                                    key={product.id || product._id}
                                    type="button"
                                    onClick={() =>
                                        handleOpenDetail(product)
                                    }
                                    className="bg-gray-50 rounded-lg border border-gray-300 overflow-hidden transition-colors text-left"
                                >
                                    <div className="aspect-[4/3] bg-gray-100">
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
                                    <div className="px-3 py-3">
                                        <div className="text-xs text-gray-500 mb-1">
                                            {product.category?.name ||
                                                product.categoryName ||
                                                ""}
                                        </div>
                                        <div className="text-sm font-semibold text-gray-800 truncate">
                                            {product.name}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Intl.NumberFormat(
                                                "vi-VN"
                                            ).format(product.price)}{" "}
                                            VND
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ProductFormModal
                open={isFormOpen}
                categories={categories}
                initialData={editingProduct}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveProduct}
            />

            <ProductDetailModal
                open={!!detailProduct}
                product={detailProduct}
                onClose={() => setDetailProduct(null)}
                onEdit={handleEditFromDetail}
                onDelete={handleDeleteFromDetail}
            />

            <DeleteConfirmModal
                open={!!deleteConfirmProduct}
                product={deleteConfirmProduct}
                onClose={() => setDeleteConfirmProduct(null)}
                onConfirm={handleConfirmDelete}
            />

            {categoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div className="text-lg font-semibold text-gray-900">
                                Thêm Danh Mục
                            </div>
                            <button
                                type="button"
                                onClick={closeCategoryModal}
                                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                            {categoryDraft.map((c) => (
                                <div
                                    key={c._id}
                                    className="relative flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-5"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                                        □
                                    </div>
                                    <input
                                        value={c.name}
                                        onChange={(e) =>
                                            updateDraftName(c._id, e.target.value)
                                        }
                                        className="flex-1 bg-transparent outline-none text-gray-900 font-medium text-base"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeDraftCategory(c._id)}
                                        className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 flex items-center justify-center text-gray-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}

                            <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-5">
                                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                                    □
                                </div>
                                <input
                                    value={categoryNewName}
                                    onChange={(e) => setCategoryNewName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addDraftCategory();
                                        }
                                    }}
                                    placeholder="Điền tên Danh mục mới..."
                                    className="flex-1 bg-transparent outline-none text-gray-900 font-medium text-base"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeCategoryModal}
                                disabled={categorySaving}
                                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={saveCategoryChanges}
                                disabled={categorySaving}
                                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                            >
                                Lưu Danh mục
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Products;
