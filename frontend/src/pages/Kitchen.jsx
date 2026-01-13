import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../services/api";

function Kitchen() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelModal, setCancelModal] = useState({
        open: false,
        order: null,
        reason: "out_of_stock",
        note: "",
    });
    const socketRef = useRef(null);

    const nowText = useMemo(() => {
        try {
            return new Intl.DateTimeFormat("en-US", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            }).format(new Date());
        } catch {
            return "";
        }
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get("/kitchen/orders", {
                params: {
                    // lấy tất cả đơn bếp đang quan tâm
                    limit: 200,
                },
            });
            setOrders(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        const socket = io({
            path: "/socket.io",
            transports: ["polling", "websocket"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 500,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join-room", "kitchen");
        });

        socket.on("new-order", (order) => {
            setOrders((prev) => {
                const exists = prev.some((o) => o._id === order?._id);
                if (exists) return prev;
                return [order, ...prev];
            });
        });

        socket.on("order-status-updated", (order) => {
            setOrders((prev) => {
                const next = prev.map((o) => (o._id === order?._id ? order : o));
                const exists = prev.some((o) => o._id === order?._id);
                return exists ? next : [order, ...prev];
            });
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    const updateKitchenStatus = async (orderId, kitchenStatus, rejectionReason) => {
        try {
            const res = await api.patch(`/kitchen/orders/${orderId}/kitchen-status`, {
                kitchenStatus,
                rejectionReason,
            });
            const updated = res.data;
            setOrders((prev) => prev.map((o) => (o._id === updated?._id ? updated : o)));
        } catch (e) {
            console.error(e);
            alert("Không thể cập nhật trạng thái. Vui lòng thử lại.");
        }
    };

    const getCancelReasonText = (key) => {
        if (key === "out_of_stock") return "Hết nguyên liệu";
        if (key === "customer_cancel") return "Khách đòi ý / hủy món";
        if (key === "input_mistake") return "Sai sót khi nhập đơn";
        if (key === "other") return "Lý do khác";
        return "";
    };

    const openCancelModal = (order) => {
        setCancelModal({
            open: true,
            order,
            reason: "out_of_stock",
            note: "",
        });
    };

    const closeCancelModal = () => {
        setCancelModal({
            open: false,
            order: null,
            reason: "out_of_stock",
            note: "",
        });
    };

    const confirmCancel = async () => {
        const order = cancelModal.order;
        if (!order?._id) return;

        const reasonText = getCancelReasonText(cancelModal.reason);
        const noteText = (cancelModal.note || "").trim();
        const combined = noteText ? `${reasonText}: ${noteText}` : reasonText;
        await updateKitchenStatus(order._id, "rejected", combined);
        closeCancelModal();
    };

    const groupOrders = (list, statuses) =>
        list
            .filter((o) => statuses.includes(o.kitchenStatus))
            .sort((a, b) => new Date(b.sentToKitchenAt || b.createdAt) - new Date(a.sentToKitchenAt || a.createdAt));

    const newOrders = groupOrders(orders, ["new"]);
    const cookingOrders = groupOrders(orders, ["accepted", "cooking"]);
    const doneOrders = groupOrders(orders, ["completed"]);

    const renderItemsSummary = (order) => {
        const items = Array.isArray(order.items) ? order.items : [];
        return items.slice(0, 3).map((it, idx) => (
            <div key={idx} className="text-xs text-gray-700">
                <span className="font-medium">{it.quantity}x</span> {it.productName}
            </div>
        ));
    };

    const headerLabel = (order) => {
        const table = order.tableNumber || "";
        const type = order.orderType || "";
        const isDineIn = type === "Dine in";
        if (!isDineIn) {
            if (type === "Take away") return `${order.orderNumber} · Mang về`;
            if (type === "Delivery") return `${order.orderNumber} · Giao hàng`;
        }
        return `${order.orderNumber} · ${table}`;
    };

    const Column = ({ title, badge, subtitle, orders: list, statusKey }) => {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[520px]">
                <div className="px-4 pt-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-gray-900">{title}</div>
                            <div
                                className={`text-xs px-2 py-0.5 rounded-full border ${
                                    statusKey === "new"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : statusKey === "cooking"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}
                            >
                                {badge}
                            </div>
                        </div>
                        <div className="text-xs text-gray-400">{subtitle}</div>
                    </div>
                </div>

                <div className="p-4 space-y-3 overflow-y-auto">
                    {list.length === 0 ? (
                        <div className="text-sm text-gray-400">Chưa có đơn</div>
                    ) : (
                        list.map((order) => (
                            <div
                                key={order._id}
                                className="bg-white rounded-xl border border-gray-300 shadow-sm p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-gray-900">
                                            {headerLabel(order)}
                                        </div>
                                        <div className="mt-1">{renderItemsSummary(order)}</div>
                                    </div>

                                    <div className="text-xs text-gray-400 whitespace-nowrap">
                                        {order.sentToKitchenAt
                                            ? new Date(order.sentToKitchenAt).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : ""}
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-end gap-2">
                                    {statusKey === "new" && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => openCancelModal(order)}
                                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            >
                                                Từ chối
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateKitchenStatus(order._id, "accepted")}
                                                className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                            >
                                                Nhận chế biến
                                            </button>
                                        </>
                                    )}

                                    {statusKey === "cooking" && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => openCancelModal(order)}
                                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateKitchenStatus(order._id, "completed")
                                                }
                                                className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                            >
                                                Đánh dấu hoàn tất
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-gray-500">Bếp nhận đơn</div>
                        <div className="text-lg font-semibold text-gray-900">Màn hình bếp</div>
                    </div>
                    <div className="text-sm text-gray-500">{nowText}</div>
                </div>

                <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2">
                                <div className="text-xl font-bold text-blue-600">{newOrders.length}</div>
                                <div className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    Chờ nhận bếp
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Đơn mới</div>
                        </div>
                        <div className="rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2">
                                <div className="text-xl font-bold text-amber-600">{cookingOrders.length}</div>
                                <div className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    Đang xử lý
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Đang chế biến</div>
                        </div>
                        <div className="rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2">
                                <div className="text-xl font-bold text-emerald-600">{doneOrders.length}</div>
                                <div className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Chờ mang ra / giao đi
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Đã xong, chờ phục vụ</div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                            <div>Mới</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <div>Đang chế biến</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                            <div>Đã xong</div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-6">
                    <Column
                        title="Đơn mới"
                        badge={newOrders.length}
                        subtitle="Cần bấm 'Nhận chế biến'"
                        orders={newOrders}
                        statusKey="new"
                    />
                    <Column
                        title="Đang chế biến"
                        badge={cookingOrders.length}
                        subtitle="Bếp đang nấu / chuẩn bị"
                        orders={cookingOrders}
                        statusKey="cooking"
                    />
                    <Column
                        title="Đã xong"
                        badge={doneOrders.length}
                        subtitle=""
                        orders={doneOrders}
                        statusKey="done"
                    />
                </div>

                {loading && (
                    <div className="mt-4 text-sm text-gray-400">Đang tải...</div>
                )}
            </div>

            {cancelModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div className="text-lg font-semibold text-gray-900">
                                Xác nhận hủy món
                            </div>
                            <button
                                type="button"
                                onClick={closeCancelModal}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                                aria-label="Đóng"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-4 h-4 text-red-600"
                                        aria-hidden="true"
                                    >
                                        <path d="M12 9v4" />
                                        <path d="M12 17h.01" />
                                        <path d="M10.29 3.86l-7.5 13A2 2 0 004.5 20h15a2 2 0 001.71-3.14l-7.5-13a2 2 0 00-3.42 0z" />
                                    </svg>
                                </div>
                                <div className="text-sm text-red-700">
                                    Bạn đang thực hiện hủy món từ đơn <span className="font-semibold">{cancelModal.order?.orderNumber}</span>. Hành động này sẽ được ghi lại trong hệ thống.
                                </div>
                            </div>

                            <div className="mt-5">
                                <div className="text-sm font-semibold text-gray-900">Lý do hủy</div>
                                <div className="mt-3 space-y-3">
                                    {["out_of_stock", "customer_cancel", "input_mistake", "other"].map((key) => {
                                        const active = cancelModal.reason === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() =>
                                                    setCancelModal((prev) => ({ ...prev, reason: key }))
                                                }
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                                                    active
                                                        ? "border-blue-500 ring-2 ring-blue-100"
                                                        : "border-gray-200 hover:bg-gray-50"
                                                }`}
                                            >
                                                <div
                                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                        active
                                                            ? "border-blue-600"
                                                            : "border-gray-300"
                                                    }`}
                                                >
                                                    {active && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-800">
                                                    {getCancelReasonText(key)}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="text-sm font-semibold text-gray-900">
                                    Ghi chú thêm (Tùy chọn)
                                </div>
                                <textarea
                                    value={cancelModal.note}
                                    onChange={(e) =>
                                        setCancelModal((prev) => ({
                                            ...prev,
                                            note: e.target.value,
                                        }))
                                    }
                                    className="mt-3 w-full min-h-28 rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    placeholder="Nhập ghi chú..."
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeCancelModal}
                                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium"
                            >
                                Quay lại
                            </button>
                            <button
                                type="button"
                                onClick={confirmCancel}
                                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold"
                            >
                                Xác nhận hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Kitchen;
