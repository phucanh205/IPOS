import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@shared/components/Sidebar";
import SearchBar from "@shared/components/SearchBar";
import DateTimeDisplay from "@shared/components/DateTimeDisplay";
import ConfirmModal from "@shared/components/ConfirmModal";
import { getHeldOrders, deleteHeldOrder } from "@shared/api/apiClient";

function HeldOrders() {
    const navigate = useNavigate();
    const [heldOrders, setHeldOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState({
        open: false,
        orderId: null,
    });

    useEffect(() => {
        loadHeldOrders();
    }, [searchQuery]);

    const loadHeldOrders = async () => {
        setLoading(true);
        try {
            const data = await getHeldOrders(searchQuery);
            setHeldOrders(data || []);
        } catch (error) {
            console.error("Error loading held orders:", error);
            setHeldOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const handleDiscard = (orderId) => {
        setDeleteConfirm({ open: true, orderId });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm.orderId) return;

        try {
            await deleteHeldOrder(deleteConfirm.orderId);
            await loadHeldOrders();
            setDeleteConfirm({ open: false, orderId: null });
        } catch (error) {
            console.error("Error deleting held order:", error);
            alert(
                "Lỗi khi xóa đơn hàng: " +
                    (error.response?.data?.error || error.message)
            );
        }
    };

    const handleResume = (order) => {
        // Navigate to home page with order ID in URL params
        navigate(`/home?resumeOrder=${order._id}`);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " Vnd";
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const heldAt = new Date(date);
        const diffInSeconds = Math.floor((now - heldAt) / 1000);

        if (diffInSeconds < 60) {
            return "Vừa xong";
        } else if (diffInSeconds < 3600) {
            const mins = Math.floor(diffInSeconds / 60);
            return `${mins} phút trước`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} giờ trước`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} ngày trước`;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-xl font-semibold text-gray-900">
                            Đơn hàng tạm giữ
                        </h1>
                        <DateTimeDisplay />
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white border-b border-gray-200 px-6 py-3">
                    <div className="flex items-center gap-4">
                        <SearchBar
                            onSearch={handleSearch}
                            placeholder="Tìm kiếm đơn hàng"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-gray-400">
                            Đang tải đơn hàng...
                        </div>
                    ) : heldOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm">
                            Không có đơn hàng nào đang được giữ
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {heldOrders.map((order) => (
                                <div
                                    key={order._id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900 mb-1">
                                                {order.orderNumber}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {order.tableNumber} -{" "}
                                                {order.orderType === "Dine in"
                                                    ? "Tại bàn"
                                                    : order.orderType ===
                                                      "Take away"
                                                    ? "Mang đi"
                                                    : "Giao hàng"}
                                            </p>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
                                            {getTimeAgo(order.heldAt)}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        {order.items.map((item, index) => (
                                            <div
                                                key={index}
                                                className="text-sm text-gray-700"
                                            >
                                                <span className="font-medium">
                                                    x{item.quantity}
                                                </span>{" "}
                                                {item.productName} -{" "}
                                                {formatPrice(item.totalPrice)}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-gray-200 pt-3 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-gray-900">
                                                Tổng tiền
                                            </span>
                                            <span className="text-base font-bold text-gray-900">
                                                {formatPrice(order.total)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() =>
                                                handleDiscard(order._id)
                                            }
                                            className="flex-1 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={() => handleResume(order)}
                                            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                                        >
                                            Tiếp tục
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirm Modal */}
            <ConfirmModal
                open={deleteConfirm.open}
                title="Xác nhận xóa"
                message="Bạn chắc chắn muốn xóa đơn hàng này?"
                warning="Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
                confirmColor="red"
                onClose={() => setDeleteConfirm({ open: false, orderId: null })}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}

export default HeldOrders;
