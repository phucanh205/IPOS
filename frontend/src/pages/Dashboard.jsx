import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import DateTimeDisplay from "../components/DateTimeDisplay";
import { getDashboardStats } from "../services/api";

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

    useEffect(() => {
        loadStats();
    }, [selectedDate]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await getDashboardStats(selectedDate);
            setStats(data);
        } catch (error) {
            console.error("Error loading dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price || 0);
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

    const formatPercentage = (value) => {
        if (value > 0) {
            return `↑ +${value.toFixed(1)}%`;
        } else if (value < 0) {
            return `↓ ${value.toFixed(1)}%`;
        }
        return "—";
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-500">Đang tải...</div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-500">Không có dữ liệu</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Tổng quan
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                    Hôm nay:
                                </span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) =>
                                        setSelectedDate(e.target.value)
                                    }
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <DateTimeDisplay />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Doanh thu */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-600">
                                    Doanh thu
                                </h3>
                                <span className="text-lg">💰</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-2">
                                {formatPrice(stats.revenue.today)}₫
                            </div>
                            <div
                                className={`text-sm ${
                                    stats.revenue.change > 0
                                        ? "text-green-600"
                                        : stats.revenue.change < 0
                                        ? "text-red-600"
                                        : "text-gray-500"
                                }`}
                            >
                                {formatPercentage(stats.revenue.change)} so với
                                hôm qua
                            </div>
                        </div>

                        {/* Đơn hàng */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-600">
                                    Đơn hàng
                                </h3>
                                <span className="text-lg">🛒</span>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-2">
                                {stats.orders.today}
                            </div>
                            <div
                                className={`text-sm ${
                                    stats.orders.change > 0
                                        ? "text-green-600"
                                        : stats.orders.change < 0
                                        ? "text-red-600"
                                        : "text-gray-500"
                                }`}
                            >
                                {formatPercentage(stats.orders.change)} so với
                                hôm qua
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Doanh thu theo giờ */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-800">
                                    Doanh thu theo giờ
                                </h3>
                                <button className="text-xs text-blue-600 hover:text-blue-700">
                                    Xem chi tiết
                                </button>
                            </div>
                            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                                <p className="text-sm text-gray-400">
                                    Biểu đồ doanh thu theo giờ (placeholder)
                                </p>
                            </div>
                            <div className="flex justify-between mt-4 text-xs text-gray-500">
                                <span>8h</span>
                                <span>10h</span>
                                <span>12h</span>
                                <span>14h</span>
                                <span>16h</span>
                                <span>18h</span>
                                <span>20h</span>
                            </div>
                        </div>

                        {/* Món bán chạy */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-800">
                                    Món bán chạy
                                </h3>
                                <button className="text-xs text-blue-600 hover:text-blue-700">
                                    Tất cả
                                </button>
                            </div>
                            <div className="space-y-3">
                                {stats.bestSellingItems.length > 0 ? (
                                    stats.bestSellingItems
                                        .slice(0, 4)
                                        .map((item, index) => (
                                            <div
                                                key={item.productId || index}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                                        <span className="text-lg">
                                                            🍽️
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {item.productName}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {item.totalQuantity}{" "}
                                                            {item.totalQuantity === 1
                                                                ? "lượt"
                                                                : "lượt"}{" "}
                                                            hôm nay
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {formatPrice(
                                                            item.price
                                                        )}
                                                        ₫
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="text-center text-gray-400 text-sm py-8">
                                        Chưa có món nào được bán
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-800">
                                Đơn hàng gần đây
                            </h3>
                            <button className="text-xs text-blue-600 hover:text-blue-700">
                                Xem tất cả đơn
                            </button>
                        </div>
                        <div className="overflow-x-auto">
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
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {stats.recentOrders.length > 0 ? (
                                        stats.recentOrders.map((order) => (
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
                                                    {formatPrice(order.total)}₫
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-8 text-center text-gray-400 text-sm"
                                            >
                                                Chưa có đơn hàng nào
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;

