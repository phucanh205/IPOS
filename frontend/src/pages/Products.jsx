import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import CategoryFilters from "../components/CategoryFilters";
import DateTimeDisplay from "../components/DateTimeDisplay";
import ProductFormModal from "../components/ProductFormModal";
import ProductDetailModal from "../components/ProductDetailModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import {
    getProducts,
    getCategories,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../services/api";

function Products() {
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
                            <DateTimeDisplay />
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
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all text-left"
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
        </>
    );
}

export default Products;
