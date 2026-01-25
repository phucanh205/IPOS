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

    const formatDayMonth = (ymd) => {
        if (!ymd) return "";
        const parts = String(ymd).split("-");
        if (parts.length !== 3) return ymd;
        const d = Number(parts[2]);
        const m = Number(parts[1]);
        if (!d || !m) return ymd;
        return `${d}/${m}`;
    };

    const buildRevenue7dWidget = (dailyRevenueRaw, selectedYmd, prev7TotalRaw) => {
        const days = Array.isArray(dailyRevenueRaw)
            ? dailyRevenueRaw
                  .map((d) => ({
                      date: d?.date,
                      revenue: Number(d?.revenue || 0),
                      orders: Number(d?.orders || 0),
                  }))
                  .filter((d) => Boolean(d.date))
            : [];

        const total7 = days.reduce((sum, d) => sum + d.revenue, 0);
        const prev7Total = Number(prev7TotalRaw || 0);
        const comparePct = prev7Total > 0 ? ((total7 - prev7Total) / prev7Total) * 100 : total7 > 0 ? 100 : 0;

        const maxRevenue = Math.max(0, ...days.map((d) => d.revenue));
        const maxDate = days.find((d) => d.revenue === maxRevenue)?.date;
        const allZero = days.length === 0 || days.every((d) => d.revenue === 0);

        const rows = days.map((d, idx) => {
            const prev = idx > 0 ? days[idx - 1].revenue : null;
            let dayChangePct = null;
            if (prev !== null) {
                dayChangePct = prev > 0 ? ((d.revenue - prev) / prev) * 100 : d.revenue > 0 ? 100 : 0;
            }
            return {
                ...d,
                dayChangePct,
                isToday: selectedYmd && d.date === selectedYmd,
                isMax: maxRevenue > 0 && d.date === maxDate,
            };
        });

        return { rows, total7, prev7Total, comparePct, maxRevenue, allZero };
    };

    const formatCompare = (value) => {
        if (value > 0) return `↑ +${value.toFixed(1)}%`;
        if (value < 0) return `↓ ${value.toFixed(1)}%`;
        return "—";
    };

    const formatCompactVnd = (value) => {
        const v = Number(value || 0);
        if (!isFinite(v)) return "0";
        if (v === 0) return "0";
        if (Math.abs(v) >= 1_000_000_000) {
            return `${(v / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}tỷ`;
        }
        if (Math.abs(v) >= 1_000_000) {
            return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}tr`;
        }
        if (Math.abs(v) >= 1_000) {
            return `${Math.round(v / 1_000)}k`;
        }
        return `${Math.round(v)}`;
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
            <div className="flex h-screen bg-gray-100">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-500">Đang tải...</div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex h-screen bg-gray-100">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-500">Không có dữ liệu</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-xl font-semibold text-gray-900">
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
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-600">
                                    Doanh thu
                                </h3>
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
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-600">
                                    Đơn hàng
                                </h3>
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
                        {/* Doanh thu theo ngày */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-800">
                                    Doanh thu theo ngày
                                </h3>
                                <button className="text-xs text-blue-600 hover:text-blue-700">
                                    Xem chi tiết
                                </button>
                            </div>
                            {(() => {
                                const widget = buildRevenue7dWidget(
                                    stats.dailyRevenue,
                                    selectedDate,
                                    stats.prev7Total
                                );

                                return (
                                    <>
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <div className="text-xs text-gray-500">Tổng 7 ngày</div>
                                                <div className="text-lg font-semibold text-gray-900">
                                                    {formatPrice(widget.total7)}₫
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500">So với 7 ngày trước</div>
                                                <div
                                                    className={`text-sm font-semibold ${
                                                        widget.comparePct > 0
                                                            ? "text-green-600"
                                                            : widget.comparePct < 0
                                                            ? "text-red-600"
                                                            : "text-gray-500"
                                                    }`}
                                                >
                                                    {formatCompare(widget.comparePct)}
                                                </div>
                                            </div>
                                        </div>

                                        {widget.allZero ? (
                                            <div className="h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-dashed border-gray-300 px-6">
                                                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl">
                                                    📉
                                                </div>
                                                <div className="mt-3 text-sm font-semibold text-gray-700">
                                                    Chưa có dữ liệu doanh thu trong 7 ngày gần nhất
                                                </div>
                                                <div className="mt-1 text-xs text-gray-500 text-center">
                                                    Khi có đơn hoàn thành, biểu đồ sẽ hiển thị xu hướng doanh thu theo ngày.
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="h-64 bg-gray-50 rounded-lg border border-gray-200 p-4">
                                                    <div className="h-full grid grid-cols-7 gap-2 items-end">
                                                        {(() => {
                                                            const max = Math.max(1, widget.maxRevenue);
                                                            return widget.rows.map((d) => {
                                                                const pct = Math.max(0, Math.min(100, (d.revenue / max) * 100));
                                                                const tooltipLines = [];
                                                                tooltipLines.push(`Ngày: ${formatDayMonth(d.date)}`);
                                                                if (d.orders > 0) {
                                                                    tooltipLines.push(`Doanh thu: ${formatPrice(d.revenue)}₫`);
                                                                } else {
                                                                    tooltipLines.push("Không có đơn hàng");
                                                                }
                                                                if (d.dayChangePct !== null) {
                                                                    tooltipLines.push(`So với hôm trước: ${formatCompare(d.dayChangePct)}`);
                                                                }
                                                                const tooltip = tooltipLines.join("\n");

                                                                const barClass = d.isMax
                                                                    ? "bg-blue-600"
                                                                    : d.isToday
                                                                    ? "bg-blue-600/90"
                                                                    : "bg-blue-600/60";

                                                                return (
                                                                    <div
                                                                        key={d.date}
                                                                        className="h-full flex flex-col justify-end"
                                                                    >
                                                                        <div className="mb-1 text-[10px] leading-none text-gray-600 text-center select-none">
                                                                            {formatCompactVnd(d.revenue)}
                                                                        </div>
                                                                        <div
                                                                            className={`w-full rounded-md ${barClass} ${
                                                                                d.isToday ? "ring-2 ring-amber-300" : ""
                                                                            }`}
                                                                            style={{
                                                                                height: `${pct}%`,
                                                                                minHeight: d.revenue > 0 ? 6 : 0,
                                                                            }}
                                                                            title={tooltip}
                                                                        />
                                                                    </div>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-7 gap-2 mt-3 text-xs text-gray-500">
                                                    {widget.rows.map((d) => (
                                                        <div key={`lbl-${d.date}`} className="text-center">
                                                            {formatDayMonth(d.date)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        {/* Món bán chạy */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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


