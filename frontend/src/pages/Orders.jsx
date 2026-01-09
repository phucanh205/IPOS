import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import DateRangePicker from "../components/DateRangePicker";
import DateTimeDisplay from "../components/DateTimeDisplay";
import OrderDetailModal from "../components/OrderDetailModal";
import { getOrders } from "../services/api";

function Orders() {
    const [orders, setOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        loadOrders();
    }, [searchQuery, dateRange]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await getOrders(
                searchQuery, 
                "", 
                dateRange.startDate, 
                dateRange.endDate
            );
            setOrders(data || []);
        } catch (error) {
            console.error("Error loading orders:", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const handleDateChange = (range) => {
        setDateRange(range);
    };

    const handleViewDetail = (order) => {
        setSelectedOrder(order);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price || 0) + " VND";
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return `${day} Thg ${month}, ${hours
            .toString()
            .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    };

    const getOrderTypeText = (orderType) => {
        const types = {
            "Dine in": "Tại bàn",
            "Take away": "Mang đi",
            Delivery: "Giao hàng",
        };
        return types[orderType] || orderType;
    };

    const getPaymentMethodText = (paymentMethod) => {
        const methods = {
            Cash: "Tiền mặt",
            Card: "Thẻ tín dụng",
            "QR Code": "Online",
        };
        return methods[paymentMethod] || paymentMethod;
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Lịch sử hóa đơn
                        </h1>
                        <div className="flex items-center gap-4">
                            <SearchBar
                                onSearch={handleSearch}
                                placeholder="Tìm theo mã đơn, khách hàng hoặc số tiền"
                            />
                            <DateRangePicker
                                onDateChange={handleDateChange}
                                startDate={dateRange.startDate}
                                endDate={dateRange.endDate}
                            />
                            <DateTimeDisplay />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-gray-400">
                            Đang tải hóa đơn...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm">
                            Không có hóa đơn nào
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Mã đơn
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Ngày & giờ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Loại đơn
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Hình thức thanh toán
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Tổng tiền
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr
                                            key={order._id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {order.orderNumber}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {getOrderTypeText(
                                                    order.orderType
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {getPaymentMethodText(
                                                    order.paymentMethod
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                {formatPrice(order.total)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleViewDetail(
                                                                order
                                                            )
                                                        }
                                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Detail Modal */}
            <OrderDetailModal
                open={!!selectedOrder}
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />
        </div>
    );
}

export default Orders;

