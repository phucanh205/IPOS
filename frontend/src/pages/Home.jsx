import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ProductGrid from "../components/ProductGrid";
import SearchBar from "../components/SearchBar";
import CategoryFilters from "../components/CategoryFilters";
import DateTimeDisplay from "../components/DateTimeDisplay";
import OrderPanel from "../components/OrderPanel";
import ProductOptionsModal from "../components/ProductOptionsModal";
import HoldOrderSuccessModal from "../components/HoldOrderSuccessModal";
import PaymentSuccessModal from "../components/PaymentSuccessModal";
import ConfirmModal from "../components/ConfirmModal";
import {
    getProducts,
    getCategories,
    createHeldOrder,
    createOrder,
    getHeldOrder,
} from "../services/api";

function Home() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [orderItems, setOrderItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orderType, setOrderType] = useState("Dine in");
    const [tableNumber, setTableNumber] = useState("Bàn 4");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [holdSuccessModal, setHoldSuccessModal] = useState({
        open: false,
        orderNumber: "",
    });
    const [paymentSuccessModal, setPaymentSuccessModal] = useState({
        open: false,
        orderNumber: "",
        subtotal: 0,
        tax: 0,
        totalPaid: 0,
        changeDue: 0,
    });
    const [closeOrderConfirm, setCloseOrderConfirm] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [selectedCategory, searchQuery]);

    // Load held order when resumeOrder param is present
    useEffect(() => {
        const resumeOrderId = searchParams.get("resumeOrder");
        if (resumeOrderId) {
            loadHeldOrder(resumeOrderId);
            // Remove the param from URL after loading
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete("resumeOrder");
            setSearchParams(newSearchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            // Add "All Items" as first category
            setCategories([
                { name: "Tất cả", slug: "all", _id: "all" },
                ...data,
            ]);
        } catch (error) {
            console.error("Error loading categories:", error);
            // Set empty categories on error
            setCategories([{ name: "Tất cả", slug: "all", _id: "all" }]);
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const categoryParam =
                selectedCategory === "all" ? null : selectedCategory;
            const data = await getProducts(categoryParam, searchQuery);
            setProducts(data || []);
        } catch (error) {
            console.error("Error loading products:", error);
            setProducts([]);
            // Show error message to user
            alert("Không thể tải sản phẩm. Vui lòng kiểm tra kết nối backend.");
        } finally {
            setLoading(false);
        }
    };

    const loadHeldOrder = async (orderId) => {
        try {
            // First, ensure all products are loaded
            const allProducts = await getProducts();
            setProducts(allProducts || []);

            // Then load the held order
            const heldOrder = await getHeldOrder(orderId);

            if (
                !heldOrder ||
                !heldOrder.items ||
                heldOrder.items.length === 0
            ) {
                alert("Đơn hàng không hợp lệ hoặc không có sản phẩm");
                return;
            }

            // Set order type and table number
            setOrderType(heldOrder.orderType || "Dine in");
            setTableNumber(heldOrder.tableNumber || "Bàn 4");

            // Convert held order items to orderItems format
            const restoredItems = heldOrder.items.map((item, index) => {
                // Safely get productId - handle both populated and non-populated cases
                let productId = null;
                if (item.productId) {
                    // If productId is populated (object), get _id
                    if (
                        typeof item.productId === "object" &&
                        item.productId._id
                    ) {
                        productId = item.productId._id;
                    } else if (typeof item.productId === "string") {
                        // If productId is a string (ObjectId)
                        productId = item.productId;
                    } else if (item.productId.toString) {
                        // If productId is an ObjectId object
                        productId = item.productId.toString();
                    }
                }

                if (!productId) {
                    console.warn(`Item ${index} has no valid productId`, item);
                    // Create a fallback product
                    return {
                        id:
                            Date.now().toString() +
                            Math.random().toString(16) +
                            index,
                        product: {
                            _id: `fallback-${index}`,
                            name: item.productName || "Unknown Product",
                            price: item.price || 0,
                            image: "",
                        },
                        quantity: item.quantity || 1,
                        size: item.size || "regular",
                        sizeLabel: item.sizeLabel || "Vừa",
                        toppings: item.toppings || [],
                        notes: item.notes || "",
                        totalPrice: item.totalPrice || item.price || 0,
                    };
                }

                // Find the product in the products list
                const product = allProducts.find(
                    (p) => p._id && p._id.toString() === productId.toString()
                );

                // Use found product or create fallback
                const finalProduct = product || {
                    _id: productId,
                    name: item.productName || "Unknown Product",
                    price: item.price || 0,
                    image:
                        (item.productId && typeof item.productId === "object"
                            ? item.productId.image
                            : "") || "",
                };

                return {
                    id:
                        Date.now().toString() +
                        Math.random().toString(16) +
                        index,
                    product: finalProduct,
                    quantity: item.quantity || 1,
                    size: item.size || "regular",
                    sizeLabel: item.sizeLabel || "Vừa",
                    toppings: item.toppings || [],
                    notes: item.notes || "",
                    totalPrice:
                        item.totalPrice ||
                        (item.price || 0) * (item.quantity || 1),
                };
            });

            setOrderItems(restoredItems);
        } catch (error) {
            console.error("Error loading held order:", error);
            alert(
                "Lỗi khi tải đơn hàng: " +
                    (error.response?.data?.error || error.message)
            );
        }
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const handleAddProduct = (product) => {
        // If product already in order without customizations, just increase qty
        const existing = orderItems.find(
            (item) =>
                item.product._id === product._id &&
                !item.size &&
                (!item.toppings || item.toppings.length === 0) &&
                !item.notes
        );

        if (existing) {
            setOrderItems((prev) =>
                prev.map((item) =>
                    item.id === existing.id
                        ? {
                              ...item,
                              quantity: item.quantity + 1,
                              totalPrice: (item.quantity + 1) * product.price,
                          }
                        : item
                )
            );
        } else {
            const newItem = {
                id: Date.now().toString() + Math.random().toString(16),
                product,
                quantity: 1,
                size: "regular",
                sizeLabel: "Vừa",
                toppings: [],
                notes: "",
                totalPrice: product.price,
            };
            setOrderItems((prev) => [...prev, newItem]);
        }
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSaveItem = (updatedItem) => {
        setOrderItems((prev) =>
            prev.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
            )
        );
        setIsModalOpen(false);
    };

    const handleIncreaseQty = (id) => {
        setOrderItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                          ...item,
                          quantity: item.quantity + 1,
                          totalPrice:
                              (item.totalPrice / item.quantity ||
                                  item.product.price) *
                              (item.quantity + 1),
                      }
                    : item
            )
        );
    };

    const handleDecreaseQty = (id) => {
        setOrderItems((prev) =>
            prev
                .map((item) =>
                    item.id === id
                        ? {
                              ...item,
                              quantity: item.quantity - 1,
                              totalPrice:
                                  (item.totalPrice / item.quantity ||
                                      item.product.price) *
                                  (item.quantity - 1),
                          }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const handleCloseOrder = () => {
        if (orderItems.length > 0) {
            setCloseOrderConfirm(true);
        }
    };

    const handleConfirmCloseOrder = () => {
        setOrderItems([]);
        setIsModalOpen(false);
        setEditingItem(null);
        setCloseOrderConfirm(false);
    };

    const handleHoldOrder = async (orderData) => {
        if (orderItems.length === 0) {
            alert("Vui lòng thêm ít nhất 1 sản phẩm vào đơn hàng");
            return;
        }

        try {
            const heldOrder = await createHeldOrder(orderData);
            setHoldSuccessModal({
                open: true,
                orderNumber: heldOrder.orderNumber,
            });
            // Clear current order
            setOrderItems([]);
            setIsModalOpen(false);
            setEditingItem(null);
        } catch (error) {
            console.error("Error holding order:", error);
            alert(
                "Lỗi khi lưu đơn hàng: " +
                    (error.response?.data?.error || error.message)
            );
        }
    };

    const handleStartNewOrder = () => {
        setHoldSuccessModal({ open: false, orderNumber: "" });
        setPaymentSuccessModal({
            open: false,
            orderNumber: "",
            subtotal: 0,
            tax: 0,
            totalPaid: 0,
            changeDue: 0,
        });
    };

    const handlePlaceOrder = async (orderData) => {
        if (orderItems.length === 0) {
            alert("Vui lòng thêm ít nhất 1 sản phẩm vào đơn hàng");
            return;
        }

        try {
            const order = await createOrder(orderData);
            setPaymentSuccessModal({
                open: true,
                orderNumber: order.orderNumber,
                subtotal: order.subtotal,
                tax: order.tax,
                totalPaid: order.totalPaid,
                changeDue: order.changeDue,
            });
            // Clear current order
            setOrderItems([]);
            setIsModalOpen(false);
            setEditingItem(null);
        } catch (error) {
            console.error("Error placing order:", error);
            alert(
                "Lỗi khi đặt hàng: " +
                    (error.response?.data?.error || error.message)
            );
        }
    };

    return (
        <>
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Top Bar */}
                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 flex items-center gap-4">
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

                    {/* Main Content with Order Panel */}
                    <div className="flex-1 overflow-hidden flex">
                        <div className="flex-1 overflow-y-auto p-6">
                            <ProductGrid
                                products={products}
                                loading={loading}
                                onProductClick={handleAddProduct}
                            />
                        </div>
                        <div className="hidden lg:block h-full">
                            <OrderPanel
                                items={orderItems}
                                onItemClick={handleOpenEdit}
                                onIncreaseQty={handleIncreaseQty}
                                onDecreaseQty={handleDecreaseQty}
                                onClose={handleCloseOrder}
                                onHoldOrder={handleHoldOrder}
                                onPlaceOrder={handlePlaceOrder}
                                orderType={orderType}
                                onOrderTypeChange={setOrderType}
                                tableNumber={tableNumber}
                                paymentMethod={paymentMethod}
                                onPaymentMethodChange={setPaymentMethod}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit modal */}
            <ProductOptionsModal
                open={isModalOpen}
                item={editingItem}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveItem}
            />

            {/* Hold Order Success Modal */}
            <HoldOrderSuccessModal
                open={holdSuccessModal.open}
                orderNumber={holdSuccessModal.orderNumber}
                onClose={() =>
                    setHoldSuccessModal({ open: false, orderNumber: "" })
                }
                onStartNew={handleStartNewOrder}
            />

            {/* Payment Success Modal */}
            <PaymentSuccessModal
                open={paymentSuccessModal.open}
                orderNumber={paymentSuccessModal.orderNumber}
                subtotal={paymentSuccessModal.subtotal}
                tax={paymentSuccessModal.tax}
                totalPaid={paymentSuccessModal.totalPaid}
                changeDue={paymentSuccessModal.changeDue}
                onClose={() =>
                    setPaymentSuccessModal({
                        open: false,
                        orderNumber: "",
                        subtotal: 0,
                        tax: 0,
                        totalPaid: 0,
                        changeDue: 0,
                    })
                }
                onStartNew={handleStartNewOrder}
            />

            {/* Close Order Confirm Modal */}
            <ConfirmModal
                open={closeOrderConfirm}
                title="Xác nhận hủy đơn hàng"
                message="Bạn có chắc muốn đóng và hủy order này? Tất cả sản phẩm sẽ bị xóa."
                warning="Hành động này không thể hoàn tác."
                confirmText="Hủy đơn hàng"
                cancelText="Hủy"
                confirmColor="red"
                onClose={() => setCloseOrderConfirm(false)}
                onConfirm={handleConfirmCloseOrder}
            />
        </>
    );
}

export default Home;
