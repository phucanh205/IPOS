import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DateTimeDisplay from "../components/DateTimeDisplay";
import api from "../services/api";

function AdminReceiving() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ date: "", rows: [], sessions: [] });
    const [lowStock, setLowStock] = useState([]);
    const [lowStockLoading, setLowStockLoading] = useState(true);
    const [actingId, setActingId] = useState(null);

    const todayKey = useMemo(() => {
        try {
            return new Date().toISOString().slice(0, 10);
        } catch {
            return "";
        }
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/receiving/summary", {
                params: { date: todayKey },
            });
            setSummary(res.data || { date: todayKey, rows: [], sessions: [] });
        } catch (e) {
            console.error(e);
            setSummary({ date: todayKey, rows: [], sessions: [] });
        } finally {
            setLoading(false);
        }
    };

    const loadLowStock = async () => {
        setLowStockLoading(true);
        try {
            const res = await api.get("/admin/receiving/low-stock");
            setLowStock(Array.isArray(res.data?.items) ? res.data.items : []);
        } catch (e) {
            console.error(e);
            setLowStock([]);
        } finally {
            setLowStockLoading(false);
        }
    };

    useEffect(() => {
        load();
        loadLowStock();
    }, []);

    const formatQty = (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return "";
        if (Math.abs(n) >= 100) return String(Math.round(n));
        return String(Math.round(n * 10) / 10);
    };

    const statusOfRow = (row) => {
        const suggested = Number(row?.suggestedQty);
        const received = Number(row?.receivedTotal);
        if (!Number.isFinite(received) || received <= 0) return { text: "Chưa nhập", cls: "bg-gray-100 text-gray-600" };
        if (!Number.isFinite(suggested) || suggested <= 0) return { text: "Đã nhập", cls: "bg-emerald-100 text-emerald-700" };
        const ratio = (received - suggested) / suggested;
        if (Math.abs(ratio) < 0.001) return { text: "OK", cls: "bg-emerald-100 text-emerald-700" };
        if (ratio < 0) return { text: "Thiếu", cls: "bg-amber-100 text-amber-700" };
        return { text: "Dư", cls: "bg-amber-100 text-amber-700" };
    };

    const completion = useMemo(() => {
        const rows = Array.isArray(summary?.rows) ? summary.rows : [];
        const total = rows.length;
        const done = rows.filter((r) => Number(r?.receivedTotal) > 0).length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        return { total, done, percent };
    }, [summary]);

    const doLowStockAction = async (ingredientId, action) => {
        if (!ingredientId || actingId) return;
        setActingId(ingredientId);
        try {
            await api.post(`/admin/receiving/low-stock/${ingredientId}/${action}`);
            await loadLowStock();
        } catch (e) {
            console.error(e);
            alert("Không thể cập nhật trạng thái cảnh báo.");
        } finally {
            setActingId(null);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="text-lg font-semibold text-gray-900">Quản lý nhập hàng &amp; Kho bếp</div>
                            <div className="text-sm text-gray-500">Ngày: {summary?.date || todayKey}</div>
                        </div>
                        <DateTimeDisplay />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <div className="text-sm font-semibold text-gray-900">Danh sách nhập hàng hôm nay</div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            load();
                                            loadLowStock();
                                        }}
                                        className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium"
                                    >
                                        Làm mới
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-100 text-gray-600">
                                                <th className="text-left font-medium px-4 py-3">Nguyên liệu</th>
                                                <th className="text-left font-medium px-4 py-3">ĐVT</th>
                                                <th className="text-center font-medium px-4 py-3">Định mức</th>
                                                <th className="text-center font-medium px-4 py-3">Thực nhận</th>
                                                <th className="text-center font-medium px-4 py-3">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                                        Đang tải...
                                                    </td>
                                                </tr>
                                            ) : (summary?.rows || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                                        Chưa có dữ liệu nhận hàng hôm nay.
                                                    </td>
                                                </tr>
                                            ) : (
                                                summary.rows.map((r) => {
                                                    const st = statusOfRow(r);
                                                    return (
                                                        <tr key={String(r.ingredientId)}>
                                                            <td className="px-4 py-3 font-semibold text-gray-900">{r.ingredientName}</td>
                                                            <td className="px-4 py-3 text-gray-700">{r.displayUnit}</td>
                                                            <td className="px-4 py-3 text-center text-gray-700">
                                                                {r.suggestedQty === null || r.suggestedQty === undefined ? "" : formatQty(r.suggestedQty)}
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-gray-700">{formatQty(r.receivedTotal)}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold ${st.cls}`}>
                                                                    {st.text}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">Tiến độ nhập hàng</div>
                                        <div className="text-xs text-gray-500">Hôm nay</div>
                                    </div>
                                    <div className="text-sm font-semibold text-blue-600">
                                        {completion.done}/{completion.total} mục
                                    </div>
                                </div>
                                <div className="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden">
                                    <div className="h-2 bg-blue-600" style={{ width: `${completion.percent}%` }} />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                                <div className="text-sm font-semibold text-gray-900">Cảnh báo kho</div>
                                <div className="mt-4 grid grid-cols-1 gap-4">
                                    {lowStockLoading ? (
                                        <div className="text-sm text-gray-400">Đang tải...</div>
                                    ) : lowStock.length === 0 ? (
                                        <div className="text-sm text-gray-400">Không có cảnh báo sắp hết.</div>
                                    ) : (
                                        lowStock.map((it) => {
                                            const danger = it.alertStatus === "open";
                                            const cardCls = danger
                                                ? "border-rose-200 bg-rose-50"
                                                : "border-amber-200 bg-amber-50";

                                            const reported = it.alertStatus === "reported";

                                            return (
                                                <div key={it._id} className={`rounded-2xl border p-4 ${cardCls}`}>
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{it.name}</div>
                                                            <div className="mt-2 text-xs text-gray-600">
                                                                Tồn kho: {formatQty(it.stockQty)} {it.displayUnit} (Min: {formatQty(it.minQty)} {it.displayUnit})
                                                            </div>
                                                            <div className="mt-1 text-xs text-gray-500">Trạng thái: {it.alertStatus}</div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            disabled={actingId === it._id || reported}
                                                            onClick={() => doLowStockAction(it._id, "report")}
                                                            className={`px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60 ${
                                                                reported
                                                                    ? "bg-amber-500"
                                                                    : "bg-rose-600 hover:bg-rose-700"
                                                            }`}
                                                        >
                                                            {reported ? "Đã báo quản lý" : "Báo quản lý"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={actingId === it._id}
                                                            onClick={() => doLowStockAction(it._id, "checked")}
                                                            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                                                        >
                                                            Đã kiểm tra
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminReceiving;
