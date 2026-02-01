import { useEffect, useMemo, useState } from "react";
import Sidebar from "@shared/components/Sidebar";
import DateTimeDisplay from "@shared/components/DateTimeDisplay";
import {
    deleteRecipeByProduct,
    getCategories,
    getIngredients,
    getProducts,
    getRecipeByProduct,
    setRecipeActiveByProduct,
    upsertRecipeByProduct,
} from "@shared/api/apiClient";

const unitLabel = (unit) => {
    if (unit === "pcs") return "Cái";
    if (unit === "kg") return "Kg";
    if (unit === "box") return "Hộp";
    if (unit === "g") return "g";
    if (unit === "ml") return "ml";
    return unit || "";
};

function ToggleSwitch({ checked, onChange, disabled }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                checked ? "bg-blue-600" : "bg-gray-200"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    checked ? "translate-x-6" : "translate-x-1"
                }`}
            />
        </button>
    );
}

function Recipes() {
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingRecipes, setLoadingRecipes] = useState(false);

    const [loadingAllProducts, setLoadingAllProducts] = useState(false);
    const [allProducts, setAllProducts] = useState([]);

    const [searchLoading, setSearchLoading] = useState(false);
    const [searchGroups, setSearchGroups] = useState([]);
    const [pendingSelectProductId, setPendingSelectProductId] = useState(null);

    const [categories, setCategories] = useState([]);
    const [categorySearch, setCategorySearch] = useState("");

    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState(null);

    const [recipeDraftByProduct, setRecipeDraftByProduct] = useState({});
    const [editingRecipeForProductId, setEditingRecipeForProductId] = useState(null);

    const [recipeExistsByProduct, setRecipeExistsByProduct] = useState({});
    const [recipeActiveByProduct, setRecipeActiveByProductState] = useState({});

    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerSearch, setPickerSearch] = useState("");
    const [pickerLoading, setPickerLoading] = useState(false);
    const [pickerIngredients, setPickerIngredients] = useState([]);

    useEffect(() => {
        loadCategories();
        loadAllProducts();
    }, []);

    const loadCategories = async () => {
        setLoadingCategories(true);
        try {
            const data = await getCategories();
            setCategories(Array.isArray(data) ? data : []);
            const first = Array.isArray(data) && data.length > 0 ? data[0] : null;
            if (first?._id) {
                setSelectedCategoryId(first._id);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
            setCategories([]);
        } finally {
            setLoadingCategories(false);
        }
    };

    const loadAllProducts = async () => {
        setLoadingAllProducts(true);
        try {
            const data = await getProducts(null, "");
            setAllProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading all products:", error);
            setAllProducts([]);
        } finally {
            setLoadingAllProducts(false);
        }
    };

    const loadProductsByCategory = async (categoryId) => {
        if (!categoryId) {
            setProducts([]);
            setSelectedProductId(null);
            return;
        }

        setLoadingProducts(true);
        try {
            const data = await getProducts(categoryId);
            const list = Array.isArray(data) ? data : [];
            setProducts(list);
            const first = list.length > 0 ? list[0] : null;
            const preferredId = pendingSelectProductId;
            const preferredInList = preferredId
                ? list.find((p) => p?._id === preferredId)
                : null;
            const nextSelectedId = preferredInList?._id || first?._id || null;
            setSelectedProductId(nextSelectedId);
            setPendingSelectProductId(null);
            if (nextSelectedId) loadRecipeByProduct(nextSelectedId);
        } catch (error) {
            console.error("Error loading products:", error);
            setProducts([]);
            setSelectedProductId(null);
        } finally {
            setLoadingProducts(false);
        }
    };

    const searchLeftPanel = async (qRaw) => {
        const q = String(qRaw || "").trim();
        if (!q) {
            setSearchGroups([]);
            setSearchLoading(false);
            return;
        }

        setSearchLoading(true);
        try {
            const data = await getProducts(null, q);
            const list = Array.isArray(data) ? data : [];

            const map = new Map();
            for (const p of list) {
                const cat = p?.category;
                const catId = cat?._id;
                if (!catId) continue;
                if (!map.has(catId)) {
                    map.set(catId, {
                        categoryId: catId,
                        categoryName: cat?.name || "",
                        products: [],
                    });
                }
                map.get(catId).products.push(p);
            }

            const groups = Array.from(map.values())
                .map((g) => ({
                    ...g,
                    products: (g.products || []).sort((a, b) =>
                        String(a?.name || "").localeCompare(String(b?.name || ""))
                    ),
                }))
                .sort((a, b) =>
                    String(a?.categoryName || "").localeCompare(
                        String(b?.categoryName || "")
                    )
                );

            setSearchGroups(groups);
        } catch (error) {
            console.error("Error searching products:", error);
            setSearchGroups([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const loadRecipeByProduct = async (productId) => {
        if (!productId) return;
        if (recipeDraftByProduct?.[productId] !== undefined) return;

        setLoadingRecipes(true);
        try {
            const recipe = await getRecipeByProduct(productId);
            const rows =
                recipe?.items?.map((it) => ({
                    ingredientId: it?.ingredient?._id,
                    name: it?.ingredient?.name,
                    unit: it?.ingredient?.baseUnit || it?.ingredient?.unit,
                    quantity:
                        it?.quantity === 0 || it?.quantity
                            ? String(it.quantity)
                            : "",
                })) || [];
            setRecipeDraftByProduct((prev) => ({ ...prev, [productId]: rows }));
            setRecipeExistsByProduct((prev) => ({ ...prev, [productId]: true }));
            setRecipeActiveByProductState((prev) => ({
                ...prev,
                [productId]: recipe?.isActive === false ? false : true,
            }));
        } catch (error) {
            const status = error?.response?.status;
            if (status === 404) {
                setRecipeDraftByProduct((prev) => ({ ...prev, [productId]: [] }));
                setRecipeExistsByProduct((prev) => ({ ...prev, [productId]: false }));
                setRecipeActiveByProductState((prev) => ({ ...prev, [productId]: false }));
            } else {
                console.error("Error loading recipe:", error);
            }
        } finally {
            setLoadingRecipes(false);
        }
    };

    useEffect(() => {
        if (selectedCategoryId) {
            loadProductsByCategory(selectedCategoryId);
        }
    }, [selectedCategoryId]);

    useEffect(() => {
        const q = String(categorySearch || "");
        if (!q.trim()) {
            setSearchGroups([]);
            return;
        }

        const t = setTimeout(() => {
            searchLeftPanel(q);
        }, 250);

        return () => clearTimeout(t);
    }, [categorySearch]);

    const defaultGroups = useMemo(() => {
        const map = new Map();

        for (const c of categories || []) {
            if (!c?._id) continue;
            map.set(String(c._id), {
                categoryId: String(c._id),
                categoryName: c?.name || "",
                products: [],
            });
        }

        for (const p of allProducts || []) {
            const cat = p?.category;
            const catId = cat?._id ? String(cat._id) : "";
            if (!catId) continue;
            if (!map.has(catId)) {
                map.set(catId, {
                    categoryId: catId,
                    categoryName: cat?.name || "",
                    products: [],
                });
            }
            map.get(catId).products.push(p);
        }

        return Array.from(map.values())
            .map((g) => ({
                ...g,
                products: (g.products || []).sort((a, b) =>
                    String(a?.name || "").localeCompare(String(b?.name || ""))
                ),
            }))
            .sort((a, b) =>
                String(a?.categoryName || "").localeCompare(
                    String(b?.categoryName || "")
                )
            );
    }, [allProducts, categories]);

    const selectedCategory = useMemo(
        () => (categories || []).find((c) => c?._id === selectedCategoryId) || null,
        [categories, selectedCategoryId]
    );

    const selectedProduct = useMemo(
        () => (products || []).find((p) => p?._id === selectedProductId) || null,
        [products, selectedProductId]
    );

    const currentRecipeRows = useMemo(() => {
        if (!selectedProductId) return [];
        return recipeDraftByProduct?.[selectedProductId] || [];
    }, [recipeDraftByProduct, selectedProductId]);

    const isSelectedProductRecipeAttached = useMemo(() => {
        if (!selectedProductId) return false;
        return !!recipeExistsByProduct?.[selectedProductId] && !!recipeActiveByProduct?.[selectedProductId];
    }, [recipeActiveByProduct, recipeExistsByProduct, selectedProductId]);

    const canSaveRecipe = useMemo(() => {
        if (!editingRecipeForProductId) return false;
        const rows = recipeDraftByProduct?.[editingRecipeForProductId] || [];
        if (!rows.length) return true;
        return rows.every((r) => {
            const q = Number(r?.quantity);
            return r?.ingredientId && !Number.isNaN(q) && q > 0;
        });
    }, [editingRecipeForProductId, recipeDraftByProduct]);

    const handleSelectCategory = (categoryId) => {
        if (categoryId === selectedCategoryId) return;
        setSelectedCategoryId(categoryId);
    };

    const handlePickProductFromSearch = (product) => {
        const catId = product?.category?._id;
        const productId = product?._id;
        if (!catId || !productId) return;
        setPendingSelectProductId(productId);
        setSelectedCategoryId(catId);
    };

    const handleSelectProduct = (productId) => {
        setSelectedProductId(productId);
        loadRecipeByProduct(productId);
    };

    const openRecipeEditor = (productId) => {
        setSelectedProductId(productId);
        loadRecipeByProduct(productId);
        setEditingRecipeForProductId(productId);
    };

    const closeRecipeEditor = () => {
        setEditingRecipeForProductId(null);
        setPickerOpen(false);
        setPickerSearch("");
        setPickerIngredients([]);
    };

    const setRecipeAttached = async (productId, attached) => {
        if (!productId) return;

        // Ensure we know whether recipe exists
        if (recipeDraftByProduct?.[productId] === undefined) {
            await loadRecipeByProduct(productId);
        }

        const exists = !!recipeExistsByProduct?.[productId];

        // Turn ON:
        // - if recipe exists -> activate it
        // - if no recipe -> open editor to create
        if (attached) {
            if (!exists) {
                openRecipeEditor(productId);
                return;
            }

            try {
                await setRecipeActiveByProduct(productId, true);
                setRecipeActiveByProductState((prev) => ({ ...prev, [productId]: true }));
            } catch (error) {
                console.error("Error enabling recipe:", error);
                alert(
                    error?.response?.data?.error ||
                        "Không thể bật công thức. Vui lòng thử lại."
                );
            }
            return;
        }

        // Turn OFF: if recipe exists, mark inactive (do not delete)
        if (exists) {
            try {
                await setRecipeActiveByProduct(productId, false);
                setRecipeActiveByProductState((prev) => ({ ...prev, [productId]: false }));
                if (editingRecipeForProductId === productId) {
                    closeRecipeEditor();
                }
            } catch (error) {
                console.error("Error disabling recipe:", error);
                alert(
                    error?.response?.data?.error ||
                        "Không thể tắt công thức. Vui lòng thử lại."
                );
            }
        } else {
            setRecipeActiveByProductState((prev) => ({ ...prev, [productId]: false }));
        }
    };

    const openPicker = async () => {
        setPickerOpen(true);
        setPickerSearch("");
        setPickerLoading(true);
        try {
            const data = await getIngredients("");
            setPickerIngredients(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading ingredients:", error);
            setPickerIngredients([]);
        } finally {
            setPickerLoading(false);
        }
    };

    const reloadPicker = async (q) => {
        setPickerLoading(true);
        try {
            const data = await getIngredients(q);
            setPickerIngredients(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading ingredients:", error);
            setPickerIngredients([]);
        } finally {
            setPickerLoading(false);
        }
    };

    const addIngredientToRecipe = (ingredient) => {
        if (!editingRecipeForProductId) return;
        if (!ingredient?._id) return;

        setRecipeDraftByProduct((prev) => {
            const current = prev?.[editingRecipeForProductId] || [];
            const exists = current.some((r) => r.ingredientId === ingredient._id);
            if (exists) return prev;
            return {
                ...prev,
                [editingRecipeForProductId]: [
                    ...current,
                    {
                        ingredientId: ingredient._id,
                        name: ingredient.name,
                        unit: ingredient.baseUnit || ingredient.unit,
                        quantity: "",
                    },
                ],
            };
        });

        setPickerOpen(false);
    };

    const updateRowQuantity = (ingredientId, quantity) => {
        if (!editingRecipeForProductId) return;
        setRecipeDraftByProduct((prev) => {
            const current = prev?.[editingRecipeForProductId] || [];
            return {
                ...prev,
                [editingRecipeForProductId]: current.map((r) =>
                    r.ingredientId === ingredientId ? { ...r, quantity } : r
                ),
            };
        });
    };

    const removeRow = (ingredientId) => {
        if (!editingRecipeForProductId) return;
        setRecipeDraftByProduct((prev) => {
            const current = prev?.[editingRecipeForProductId] || [];
            return {
                ...prev,
                [editingRecipeForProductId]: current.filter(
                    (r) => r.ingredientId !== ingredientId
                ),
            };
        });
    };

    const handleSaveRecipe = () => {
        if (!canSaveRecipe) return;

        const productId = editingRecipeForProductId;
        const rows = recipeDraftByProduct?.[productId] || [];

        if (!rows.length) {
            deleteRecipeByProduct(productId)
                .catch((error) => {
                    const status = error?.response?.status;
                    if (status !== 404) {
                        console.error("Error deleting recipe:", error);
                        alert(
                            error?.response?.data?.error ||
                                "Xóa công thức thất bại. Vui lòng thử lại."
                        );
                        return;
                    }
                })
                .finally(() => {
                    setRecipeDraftByProduct((prev) => ({
                        ...prev,
                        [productId]: [],
                    }));
                    setRecipeExistsByProduct((prev) => ({ ...prev, [productId]: false }));
                    setRecipeActiveByProductState((prev) => ({ ...prev, [productId]: false }));
                    closeRecipeEditor();
                });
            return;
        }

        const items = rows.map((r) => ({
            ingredientId: r.ingredientId,
            quantity: Number(r.quantity),
        }));

        upsertRecipeByProduct(productId, items)
            .then((recipe) => {
                const nextRows =
                    recipe?.items?.map((it) => ({
                        ingredientId: it?.ingredient?._id,
                        name: it?.ingredient?.name,
                        unit: it?.ingredient?.baseUnit || it?.ingredient?.unit,
                        quantity:
                            it?.quantity === 0 || it?.quantity
                                ? String(it.quantity)
                                : "",
                    })) || [];
                setRecipeDraftByProduct((prev) => ({
                    ...prev,
                    [productId]: nextRows,
                }));
                setRecipeExistsByProduct((prev) => ({ ...prev, [productId]: true }));
                setRecipeActiveByProductState((prev) => ({ ...prev, [productId]: true }));
                closeRecipeEditor();
            })
            .catch((error) => {
                console.error("Error saving recipe:", error);
                alert(
                    error?.response?.data?.error ||
                        "Lưu công thức thất bại. Vui lòng thử lại."
                );
            });
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="text-lg font-semibold text-gray-900">
                            Gắn nguyên liệu theo sản phẩm
                        </div>
                        <DateTimeDisplay />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left: category list + search */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <input
                                            value={categorySearch}
                                            onChange={(e) => setCategorySearch(e.target.value)}
                                            placeholder="Tìm danh mục hoặc món..."
                                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        />
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium"
                                            onClick={() => {}}
                                        >
                                            Bộ lọc
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-[70vh] overflow-y-auto">
                                    {String(categorySearch || "").trim() ? (
                                        searchLoading ? (
                                            <div className="p-6 text-center text-gray-400 text-sm">
                                                Đang tìm...
                                            </div>
                                        ) : searchGroups.length === 0 ? (
                                            <div className="p-6 text-center text-gray-400 text-sm">
                                                Không có kết quả
                                            </div>
                                        ) : (
                                            <div className="space-y-3 p-3">
                                                {searchGroups.map((g) => {
                                                    const count = g.products.length;
                                                    const showItems = count <= 4;
                                                    const active =
                                                        g.categoryId === selectedCategoryId;
                                                    return (
                                                        <div
                                                            key={g.categoryId}
                                                            className={`rounded-2xl border overflow-hidden ${
                                                                active
                                                                    ? "border-blue-200 bg-blue-50"
                                                                    : "border-gray-100 bg-white"
                                                            }`}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleSelectCategory(
                                                                        g.categoryId
                                                                    )
                                                                }
                                                                className={`w-full text-left px-4 py-3 transition-colors ${
                                                                    active
                                                                        ? "bg-blue-100 hover:bg-blue-100"
                                                                        : "bg-gray-50 hover:bg-gray-100"
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div className="font-semibold text-gray-900">
                                                                        {g.categoryName}
                                                                    </div>
                                                                    <div className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
                                                                        {count} món
                                                                    </div>
                                                                </div>
                                                            </button>

                                                            {showItems ? (
                                                                <div className="divide-y divide-gray-100 bg-white">
                                                                    {g.products.map((p) => (
                                                                        <button
                                                                            key={p._id}
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handlePickProductFromSearch(
                                                                                    p
                                                                                )
                                                                            }
                                                                            className="w-full text-left px-4 py-3 hover:bg-gray-50"
                                                                        >
                                                                            <div className="text-sm text-gray-800">
                                                                                {p.name}
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )
                                    ) : loadingAllProducts || loadingCategories ? (
                                        <div className="p-6 text-center text-gray-400 text-sm">
                                            Đang tải...
                                        </div>
                                    ) : defaultGroups.length === 0 ? (
                                        <div className="p-6 text-center text-gray-400 text-sm">
                                            Không có danh mục
                                        </div>
                                    ) : (
                                        <div className="space-y-3 p-3">
                                            {defaultGroups.map((g) => {
                                                const count = g.products.length;
                                                const showItems = count <= 4;
                                                const active =
                                                    g.categoryId === selectedCategoryId;
                                                return (
                                                    <div
                                                        key={g.categoryId}
                                                        className={`rounded-2xl border overflow-hidden ${
                                                            active
                                                                ? "border-blue-200 bg-blue-50"
                                                                : "border-gray-100 bg-white"
                                                        }`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleSelectCategory(
                                                                    g.categoryId
                                                                )
                                                            }
                                                            className={`w-full text-left px-4 py-3 transition-colors ${
                                                                active
                                                                    ? "bg-blue-100 hover:bg-blue-100"
                                                                    : "bg-gray-50 hover:bg-gray-100"
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="font-semibold text-gray-900">
                                                                    {g.categoryName}
                                                                </div>
                                                                <div className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
                                                                    {count} món
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {showItems ? (
                                                            <div className="divide-y divide-gray-100 bg-white">
                                                                {g.products.map((p) => (
                                                                    <button
                                                                        key={p._id}
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handlePickProductFromSearch(
                                                                                p
                                                                            )
                                                                        }
                                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50"
                                                                    >
                                                                        <div className="text-sm text-gray-800">
                                                                            {p.name}
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: products list + selected product detail */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-200">
                                    <div className="text-sm text-gray-700">
                                        Danh sách món trong danh mục: {" "}
                                        <span className="font-semibold text-blue-700">
                                            {selectedCategory?.name || ""}
                                        </span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                                <th className="text-left font-medium px-5 py-3">
                                                    Món
                                                </th>
                                                <th className="text-left font-medium px-5 py-3">
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {loadingProducts ? (
                                                <tr>
                                                    <td
                                                        colSpan={2}
                                                        className="px-5 py-10 text-center text-gray-400"
                                                    >
                                                        Đang tải món...
                                                    </td>
                                                </tr>
                                            ) : products.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={2}
                                                        className="px-5 py-10 text-center text-gray-400"
                                                    >
                                                        Danh mục chưa có món
                                                    </td>
                                                </tr>
                                            ) : (
                                                products.map((p) => {
                                                    const active = p?._id === selectedProductId;
                                                    const loaded =
                                                        recipeDraftByProduct?.[p._id] !==
                                                        undefined;
                                                    const exists = loaded
                                                        ? recipeExistsByProduct?.[p._id]
                                                        : false;
                                                    const attached = loaded
                                                        ? recipeActiveByProduct?.[p._id]
                                                        : false;
                                                    const hasRecipe = loaded
                                                        ? recipeExistsByProduct?.[p._id]
                                                        : false;
                                                    const isRowLoading = loadingRecipes && active;
                                                    return (
                                                        <tr
                                                            key={p._id}
                                                            className={`border-t border-gray-200 ${
                                                                active
                                                                    ? "bg-blue-50"
                                                                    : isRowLoading
                                                                    ? "hover:bg-gray-50"
                                                                    : "hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            <td className="px-5 py-3">
                                                                <button
                                                                    type="button"
                                                                    className="text-left w-full"
                                                                    onClick={() =>
                                                                        handleSelectProduct(
                                                                            p._id
                                                                        )
                                                                    }
                                                                >
                                                                    <div className="font-semibold text-gray-900">
                                                                        {p.name}
                                                                    </div>
                                                                </button>
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <ToggleSwitch
                                                                            checked={attached}
                                                                            onChange={(v) =>
                                                                                setRecipeAttached(
                                                                                    p._id,
                                                                                    v
                                                                                )
                                                                            }
                                                                            disabled={loadingRecipes}
                                                                        />
                                                                        <span className="text-xs text-gray-600">
                                                                            {attached
                                                                                ? "Đã gắn"
                                                                                : "Chưa gắn"}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openRecipeEditor(
                                                                                p._id
                                                                            )
                                                                        }
                                                                        disabled={loadingRecipes}
                                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                                                            attached
                                                                                ? "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                                                                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                                                        } ${
                                                                            loadingRecipes
                                                                                ? "opacity-60 cursor-not-allowed"
                                                                                : ""
                                                                        }`}
                                                                    >
                                                                        {isRowLoading
                                                                            ? "Đang tải..."
                                                                            : attached
                                                                            ? "Sửa công thức"
                                                                            : hasRecipe
                                                                            ? "Sửa công thức"
                                                                            : "Gắn công thức"}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-200">
                                    <div className="text-sm text-blue-700">
                                        Đang chọn:{" "}
                                        <span className="font-semibold">
                                            {selectedProduct?.name || ""}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5">
                                    {!selectedProduct ? (
                                        <div className="text-gray-400 text-sm">
                                            Chọn một món để xem chi tiết.
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                                {selectedProduct.image ? (
                                                    <img
                                                        src={selectedProduct.image}
                                                        alt={selectedProduct.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display =
                                                                "none";
                                                        }}
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">
                                                    {selectedProduct.name}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {selectedProduct.category?.name || ""}
                                                </div>
                                                <div className="mt-2">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                            isSelectedProductRecipeAttached
                                                                ? "bg-blue-50 text-blue-700"
                                                                : "bg-gray-100 text-gray-600"
                                                        }`}
                                                    >
                                                        {isSelectedProductRecipeAttached
                                                            ? "Đã gắn công thức"
                                                            : "Chưa gắn công thức"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {editingRecipeForProductId && selectedProduct && (
                                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-200">
                                        <div className="text-sm text-blue-700">
                                            Đang chọn: {" "}
                                            <span className="font-semibold">
                                                {selectedProduct?.name || ""}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="flex items-start gap-6">
                                            <div className="flex-1 overflow-x-auto">
                                                <table className="min-w-full text-sm">
                                                    <thead className="bg-gray-50 text-gray-600">
                                                        <tr>
                                                            <th className="text-left font-medium px-4 py-3">
                                                                Tên nguyên liệu
                                                            </th>
                                                            <th className="text-left font-medium px-4 py-3">
                                                                Đơn vị
                                                            </th>
                                                            <th className="text-left font-medium px-4 py-3">
                                                                Định lượng
                                                            </th>
                                                            <th className="text-left font-medium px-4 py-3">
                                                                Thao tác
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {(
                                                            recipeDraftByProduct?.[
                                                                editingRecipeForProductId
                                                            ] || []
                                                        ).length === 0 ? (
                                                            <tr>
                                                                <td
                                                                    colSpan={4}
                                                                    className="px-4 py-8 text-center text-gray-400"
                                                                >
                                                                    Chưa có nguyên liệu. Bấm “+ Thêm nguyên liệu riêng”.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            (
                                                                recipeDraftByProduct?.[
                                                                    editingRecipeForProductId
                                                                ] || []
                                                            ).map((r) => (
                                                                <tr key={r.ingredientId}>
                                                                    <td className="px-4 py-3 font-medium text-gray-900">
                                                                        {r.name}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-gray-600">
                                                                        {unitLabel(r.unit)}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <input
                                                                            value={r.quantity}
                                                                            onChange={(e) =>
                                                                                updateRowQuantity(
                                                                                    r.ingredientId,
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            type="number"
                                                                            min="0"
                                                                            className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeRow(
                                                                                    r.ingredientId
                                                                                )
                                                                            }
                                                                            className="w-25 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium"
                                                                        >
                                                                            Xóa
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                                <div className="text-xs text-gray-500 mt-3">
                                                    Có thể chỉnh định lượng từng thành phần ở đây.
                                                </div>
                                            </div>

                                            <div className="w-full max-w-[220px] shrink-0 space-y-3">
                                                <button
                                                    type="button"
                                                    onClick={openPicker}
                                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold"
                                                >
                                                    + Thêm nguyên liệu riêng
                                                </button>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={closeRecipeEditor}
                                                        className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold"
                                                    >
                                                        Hủy bỏ
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={!canSaveRecipe}
                                                        onClick={handleSaveRecipe}
                                                        className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                                                            canSaveRecipe
                                                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                        }`}
                                                    >
                                                        Lưu thay đổi
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {pickerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <div className="text-lg font-semibold text-gray-900">
                                    Danh sách nguyên liệu
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Nguyên liệu hiện đang có trong kho bếp
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPickerOpen(false)}
                                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <input
                                    value={pickerSearch}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setPickerSearch(v);
                                        reloadPicker(v);
                                    }}
                                    placeholder="Tìm theo tên, nhóm, nhà cung cấp..."
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                />
                                <div className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold whitespace-nowrap">
                                    Tổng: {pickerIngredients.length} nguyên liệu
                                </div>
                            </div>

                            <div className="max-h-[55vh] overflow-y-auto border border-gray-100 rounded-2xl">
                                <div className="grid grid-cols-2 text-xs text-gray-500 px-4 py-3 border-b border-gray-100 bg-gray-50">
                                    <div>Nguyên liệu</div>
                                    <div className="text-right">Nhóm</div>
                                </div>

                                {pickerLoading ? (
                                    <div className="p-6 text-center text-gray-400 text-sm">
                                        Đang tải...
                                    </div>
                                ) : pickerIngredients.length === 0 ? (
                                    <div className="p-6 text-center text-gray-400 text-sm">
                                        Không có nguyên liệu
                                    </div>
                                ) : (
                                    pickerIngredients.map((ing) => (
                                        <button
                                            key={ing._id}
                                            type="button"
                                            onClick={() => addIngredientToRecipe(ing)}
                                            className="w-full text-left px-4 py-4 border-b border-gray-100 hover:bg-gray-50"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="font-semibold text-gray-900">
                                                        {ing.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Nhà cung cấp: {ing.supplierName || ""}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-500 text-right mt-1">
                                                    {ing.group || ""}
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setPickerOpen(false)}
                                className="w-full mt-4 px-4 py-3 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Recipes;
