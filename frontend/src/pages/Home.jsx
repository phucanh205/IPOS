import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
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

const REJECTED_NOTIFS_STORAGE_KEY = "pos_rejected_notifs_v1";
const REJECTED_NOTIFS_KEEP_DAYS = 14;

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

     const socketRef = useRef(null);
     const [rejectedNotifs, setRejectedNotifs] = useState([]);
     const [rejectedHydrated, setRejectedHydrated] = useState(false);
     const [unreadRejectedIds, setUnreadRejectedIds] = useState(() => new Set());
     const [rejectedModalOpen, setRejectedModalOpen] = useState(false);
     const [rejectedFilter, setRejectedFilter] = useState("today");
     const [rejectedDate, setRejectedDate] = useState(
         new Date().toISOString().split("T")[0]
     );
     const [rejectedDetail, setRejectedDetail] = useState({ open: false, order: null });

     const unreadRejectedCount = unreadRejectedIds.size;

     const formatTime = (value) => {
         if (!value) return "";
         try {
             return new Date(value).toLocaleTimeString([], {
                 hour: "2-digit",
                 minute: "2-digit",
             });
         } catch {
             return "";
         }
     };

     const toYmd = (value) => {
         if (!value) return "";
         try {
             return new Date(value).toISOString().split("T")[0];
         } catch {
             return "";
         }
     };

     const formatDateShort = (value) => {
         if (!value) return "";
         try {
             return new Date(value).toLocaleDateString([], {
                 day: "2-digit",
                 month: "2-digit",
                 year: "numeric",
             });
         } catch {
             return "";
         }
     };

     const parseRejectedReason = (text) => {
         const raw = (text || "").trim();
         if (!raw) return { reason: "", note: "" };
         const idx = raw.indexOf(":");
         if (idx === -1) return { reason: raw, note: "" };
         const reason = raw.slice(0, idx).trim();
         const note = raw.slice(idx + 1).trim();
         return { reason, note };
     };

     const filteredRejectedNotifs = useMemo(() => {
         const list = Array.isArray(rejectedNotifs) ? rejectedNotifs : [];
         const now = Date.now();
         const startOfToday = new Date();
         startOfToday.setHours(0, 0, 0, 0);

         const within = (t) => {
             const ts = t ? new Date(t).getTime() : 0;
             if (!ts) return false;
             if (rejectedFilter === "last_1h") return ts >= now - 60 * 60 * 1000;
             if (rejectedFilter === "last_24h") return ts >= now - 24 * 60 * 60 * 1000;
             if (rejectedFilter === "today") return ts >= startOfToday.getTime();
             if (rejectedFilter === "date") return toYmd(ts) === rejectedDate;
             return true;
         };

         return list
             .filter((n) => within(n?.rejectedAt || n?.kitchenRejectedAt || n?.updatedAt || n?.createdAt))
             .sort((a, b) => {
                 const ta = new Date(a?.rejectedAt || a?.kitchenRejectedAt || a?.updatedAt || a?.createdAt || 0).getTime();
                 const tb = new Date(b?.rejectedAt || b?.kitchenRejectedAt || b?.updatedAt || b?.createdAt || 0).getTime();
                 return tb - ta;
             });
     }, [rejectedNotifs, rejectedFilter, rejectedDate]);

     useEffect(() => {
         try {
             const raw = localStorage.getItem(REJECTED_NOTIFS_STORAGE_KEY);
             if (!raw) return;
             const parsed = JSON.parse(raw);
             if (Array.isArray(parsed)) {
                 setRejectedNotifs(parsed);
             }
         } catch {
             // ignore
         }
         setRejectedHydrated(true);
     }, []);

     useEffect(() => {
         if (!rejectedHydrated) return;
         try {
             const list = Array.isArray(rejectedNotifs) ? rejectedNotifs : [];
             const cutoff = Date.now() - REJECTED_NOTIFS_KEEP_DAYS * 24 * 60 * 60 * 1000;
             const pruned = list.filter((o) => {
                 const when = o?.rejectedAt || o?.kitchenRejectedAt || o?.updatedAt || o?.createdAt;
                 const ts = when ? new Date(when).getTime() : 0;
                 return ts && ts >= cutoff;
             });

             localStorage.setItem(REJECTED_NOTIFS_STORAGE_KEY, JSON.stringify(pruned));

             if (pruned.length !== list.length) {
                 setRejectedNotifs(pruned);
             }
         } catch {
             // ignore
         }
     }, [rejectedNotifs, rejectedHydrated]);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [selectedCategory, searchQuery]);

     useEffect(() => {
         const socketUrl = import.meta.env.DEV ? "http://localhost:5000" : undefined;
         const socket = io(socketUrl, {
             path: "/socket.io",
             transports: ["polling", "websocket"],
             reconnection: true,
             reconnectionAttempts: 10,
             reconnectionDelay: 500,
         });

         socketRef.current = socket;

         socket.on("connect", () => {
             socket.emit("join-room", "cashier");
         });

         socket.on("order-status-updated", (order) => {
             if (!order?._id) return;
             if (order?.kitchenStatus !== "rejected") return;

             const rejectedAt = order?.kitchenRejectedAt || order?.updatedAt || order?.createdAt || new Date().toISOString();
             setRejectedNotifs((prev) => {
                 const list = Array.isArray(prev) ? prev : [];
                 const exists = list.some((x) => x?._id === order._id);
                 if (exists) {
                     return list.map((x) => (x?._id === order._id ? { ...order, rejectedAt } : x));
                 }
                 return [{ ...order, rejectedAt }, ...list].slice(0, 200);
             });
             setUnreadRejectedIds((prev) => {
                 const next = new Set(prev);
                 next.add(order._id);
                 return next;
             });
         });

         return () => {
             socket.disconnect();
             socketRef.current = null;
         };
     }, []);

     const openRejectedModal = () => {
         setRejectedModalOpen(true);
         setUnreadRejectedIds(new Set());
         setRejectedDate(new Date().toISOString().split("T")[0]);
     };

     const closeRejectedModal = () => {
         setRejectedModalOpen(false);
     };

     const openRejectedDetail = (order) => {
         setRejectedDetail({ open: true, order });
     };

     const closeRejectedDetail = () => {
         setRejectedDetail({ open: false, order: null });
     };

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
            setTableNumber(heldOrder.tableNumber || "Bàn 1");

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
        // Kiểm tra xem sản phẩm đã tồn tại trong order chưa (chỉ cần cùng product._id)
        const existing = orderItems.find(
            (item) => item.product._id === product._id
        );

        if (existing) {
            // Sản phẩm đã tồn tại, chỉ tăng số lượng
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
            // Sản phẩm chưa tồn tại, thêm mới
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
        if (!updatedItem?.id) {
            const newItem = {
                ...updatedItem,
                id: Date.now().toString() + Math.random().toString(16),
            };
            setOrderItems((prev) => [...prev, newItem]);
            setIsModalOpen(false);
            return;
        }

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
                          totalPrice: item.product.price * (item.quantity + 1),
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
                              totalPrice: item.product.price * (item.quantity - 1),
                          }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const handleRemoveItem = (id) => {
        setOrderItems((prev) => prev.filter((item) => item.id !== id));
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
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={openRejectedModal}
                                    className="relative flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-full transition-colors"
                                >
                                    <span className="text-lg">👥</span>
                                    <span className="font-medium">Thông báo</span>
                                    {unreadRejectedCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center">
                                            {unreadRejectedCount}
                                        </span>
                                    )}
                                </button>
                                <DateTimeDisplay />
                            </div>
                        </div>
                    </div>

                    {/* Main Content with Order Panel */}
                    <div className="flex-1 overflow-hidden flex">
                        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                            <div className="max-w-[1100px]">
                                <ProductGrid
                                    products={products}
                                    loading={loading}
                                    onProductClick={handleAddProduct}
                                />
                            </div>
                        </div>
                        <div className="hidden lg:block h-full w-[460px] bg-gray-50 p-6 border-l border-gray-200">
                            <OrderPanel
                                items={orderItems}
                                onItemClick={handleOpenEdit}
                                onIncreaseQty={handleIncreaseQty}
                                onDecreaseQty={handleDecreaseQty}
                                onRemoveItem={handleRemoveItem}
                                onClose={handleCloseOrder}
                                onHoldOrder={handleHoldOrder}
                                onPlaceOrder={handlePlaceOrder}
                                orderType={orderType}
                                onOrderTypeChange={setOrderType}
                                tableNumber={tableNumber}
                                onTableNumberChange={setTableNumber}
                                paymentMethod={paymentMethod}
                                onPaymentMethodChange={setPaymentMethod}
                            />
                        </div>
                        
                        {/* Mobile Order Panel */}
                        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
                            <div className="max-h-96 overflow-y-auto">
                                <OrderPanel
                                    items={orderItems}
                                    onItemClick={handleOpenEdit}
                                    onIncreaseQty={handleIncreaseQty}
                                    onDecreaseQty={handleDecreaseQty}
                                    onRemoveItem={handleRemoveItem}
                                    onClose={handleCloseOrder}
                                    onHoldOrder={handleHoldOrder}
                                    onPlaceOrder={handlePlaceOrder}
                                    orderType={orderType}
                                    onOrderTypeChange={setOrderType}
                                    tableNumber={tableNumber}
                                    onTableNumberChange={setTableNumber}
                                    paymentMethod={paymentMethod}
                                    onPaymentMethodChange={setPaymentMethod}
                                />
                            </div>
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

             {rejectedModalOpen && (
                 <div
                     className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                     onClick={closeRejectedModal}
                 >
                     <div
                         className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-xl border border-gray-200 overflow-hidden"
                         onClick={(e) => e.stopPropagation()}
                     >
                         <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between">
                             <div>
                                 <div className="text-xl font-semibold text-gray-900">
                                     Chi tiết đơn bị từ chối
                                 </div>
                                 <div className="mt-1 text-sm text-gray-500">
                                     Thông tin nhanh đơn hàng bị từ chối từ bếp
                                 </div>
                             </div>
                             <button
                                 type="button"
                                 onClick={closeRejectedModal}
                                 className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                 aria-label="Đóng"
                             >
                                 ×
                             </button>
                         </div>

                         <div className="px-6 py-4">
                             <div className="flex items-center justify-between">
                                 <div className="text-sm font-semibold text-gray-900">
                                     Danh sách đơn bị từ chối
                                 </div>
                                 <select
                                     value={rejectedFilter}
                                     onChange={(e) => setRejectedFilter(e.target.value)}
                                     className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                 >
                                     <option value="today">Hôm nay</option>
                                     <option value="last_1h">1 giờ gần nhất</option>
                                     <option value="last_24h">24 giờ gần nhất</option>
                                     <option value="date">Theo ngày</option>
                                     <option value="all">Tất cả</option>
                                 </select>
                             </div>

                             {rejectedFilter === "date" && (
                                 <div className="mt-3">
                                     <input
                                         type="date"
                                         value={rejectedDate}
                                         onChange={(e) => setRejectedDate(e.target.value)}
                                         className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                     />
                                 </div>
                             )}

                             <div className="mt-4 rounded-2xl border border-gray-200 overflow-hidden">
                                 {filteredRejectedNotifs.length === 0 ? (
                                     <div className="py-10 text-center text-sm text-gray-500">
                                         Không có đơn bị từ chối trong khoảng thời gian này
                                     </div>
                                 ) : (
                                     filteredRejectedNotifs.map((o) => {
                                         const when = o?.rejectedAt || o?.kitchenRejectedAt || o?.updatedAt || o?.createdAt;
                                         const { reason } = parseRejectedReason(o?.kitchenRejectionReason);
                                         const totalItems = Array.isArray(o?.items)
                                             ? o.items.reduce((sum, it) => sum + Number(it?.quantity || 0), 0)
                                             : 0;

                                         return (
                                             <button
                                                 key={o._id}
                                                 type="button"
                                                 onClick={() => openRejectedDetail(o)}
                                                 className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                             >
                                                 <div>
                                                     <div className="text-lg font-semibold text-gray-900">
                                                         {o?.orderNumber || "#"}
                                                     </div>
                                                     <div className="mt-1 text-sm text-gray-500">
                                                         {formatTime(when)} - {formatDateShort(when)}
                                                         {totalItems > 0 ? ` • x${totalItems}` : ""}
                                                     </div>
                                                 </div>
                                                 <div className="px-4 py-2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium">
                                                     {reason || "Từ chối"}
                                                 </div>
                                             </button>
                                         );
                                     })
                                 )}
                             </div>
                         </div>

                         <div className="px-6 py-5">
                             <button
                                 type="button"
                                 onClick={closeRejectedModal}
                                 className="w-full py-3 rounded-xl bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200"
                             >
                                 Đóng
                             </button>
                         </div>
                     </div>
                 </div>
             )}

             {rejectedDetail.open && (
                 <div
                     className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                     onClick={closeRejectedDetail}
                 >
                     <div
                         className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl border border-gray-200 overflow-hidden"
                         onClick={(e) => e.stopPropagation()}
                     >
                         <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between">
                             <div>
                                 <div className="text-lg font-semibold text-gray-900">
                                     Bếp đã hủy món
                                 </div>
                                 <div className="mt-1 text-sm text-gray-500">
                                     Nhà bếp vừa gửi thông báo hủy món trong đơn hàng đang phục vụ.
                                 </div>
                             </div>
                             <button
                                 type="button"
                                 onClick={closeRejectedDetail}
                                 className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                 aria-label="Đóng"
                             >
                                 ×
                             </button>
                         </div>

                         {(() => {
                             const o = rejectedDetail.order;
                             const when = o?.rejectedAt || o?.kitchenRejectedAt || o?.updatedAt || o?.createdAt;
                             const { reason, note } = parseRejectedReason(o?.kitchenRejectionReason);
                             const itemsText = Array.isArray(o?.items)
                                 ? o.items
                                       .map((it) => {
                                           const q = Number(it?.quantity || 0);
                                           const name = it?.productName || it?.productId?.name || "";
                                           return q > 0 ? `${q}x ${name}` : name;
                                       })
                                       .filter(Boolean)
                                       .slice(0, 2)
                                       .join(", ")
                                 : "";

                             return (
                                 <div className="p-6">
                                     <div className="rounded-2xl bg-slate-100 p-5">
                                         <div className="grid grid-cols-[110px_12px_1fr] gap-x-3 gap-y-3 text-sm">
                                             <div className="text-gray-600">Đơn hàng</div>
                                             <div className="text-gray-600">:</div>
                                             <div className="text-gray-900 font-semibold">
                                                 {o?.orderNumber || "#"}
                                                 {o?.tableNumber ? ` - ${o.tableNumber}` : ""}
                                             </div>

                                             <div className="text-gray-600">Món hủy</div>
                                             <div className="text-gray-600">:</div>
                                             <div className="text-gray-900 font-semibold">
                                                 {itemsText || "—"}
                                             </div>

                                             <div className="text-gray-600">Lý do</div>
                                             <div className="text-gray-600">:</div>
                                             <div className="text-red-600 font-semibold">
                                                 {reason || "—"}
                                             </div>

                                             {note ? (
                                                 <>
                                                     <div className="text-gray-600">Ghi chú</div>
                                                     <div className="text-gray-600">:</div>
                                                     <div className="text-gray-900">{note}</div>
                                                 </>
                                             ) : null}

                                             <div className="text-gray-600">Thời gian</div>
                                             <div className="text-gray-600">:</div>
                                             <div className="text-gray-900 font-semibold">
                                                 {formatTime(when) || ""}
                                             </div>
                                         </div>
                                     </div>

                                     <div className="mt-5">
                                         <button
                                             type="button"
                                             onClick={closeRejectedDetail}
                                             className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                                         >
                                             Đã hiểu
                                         </button>
                                     </div>
                                 </div>
                             );
                         })()}
                     </div>
                 </div>
             )}
        </>
    );
}

export default Home;
