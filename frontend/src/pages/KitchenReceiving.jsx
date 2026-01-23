import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function KitchenReceiving() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [dateText, setDateText] = useState("");
    const [daily, setDaily] = useState([]);
    const [other, setOther] = useState([]);
    const [receivedById, setReceivedById] = useState({});
    const [notesById, setNotesById] = useState({});
    const [noteModal, setNoteModal] = useState({ open: false, row: null, value: "" });
    const [dailyPage, setDailyPage] = useState(1);
    const [hiddenIds, setHiddenIds] = useState({});

    const DAILY_PAGE_SIZE = 8;

    const nowText = useMemo(() => {
        try {
            return new Intl.DateTimeFormat("vi-VN", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }).format(new Date());
        } catch {
            return "";
        }
    }, []);

    const formatQty = (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return "";
        if (Math.abs(n) >= 100) return String(Math.round(n));
        return String(Math.round(n * 10) / 10);
    };

    const reasonLabel = (row) => {
        if (row?.issueRule === "daily") return "Định kỳ (Daily)";
        if (row?.reason === "cycle") return "Theo chu kỳ";
        if (row?.reason === "low_stock") return "Sắp hết";
        if (row?.issueRule === "long_storage") return "Tồn kho dài ngày";
        return "";
    };

    const reasonBadgeClass = (row) => {
        if (row?.reason === "low_stock") return "bg-rose-100 text-rose-700";
        if (row?.reason === "cycle") return "bg-slate-100 text-slate-700";
        return "bg-slate-100 text-slate-700";
    };

    const calcStatus = (suggested, received) => {
        const s = Number(suggested);
        const r = Number(received);
        if (!Number.isFinite(r)) return { text: "Chờ nhập", cls: "text-gray-500" };
        if (!Number.isFinite(s) || s === 0) return { text: "OK", cls: "text-emerald-600" };
        const diff = r - s;
        const ratio = diff / s;
        if (Math.abs(ratio) < 0.001) return { text: "OK", cls: "text-emerald-600" };
        if (diff < 0) return { text: `Thiếu (${Math.round(Math.abs(ratio) * 100)}%)`, cls: "text-amber-600" };
        return { text: `Dư (+${Math.round(Math.abs(ratio) * 100)}%)`, cls: "text-amber-600" };
    };

    const openNoteModal = (row) => {
        if (!row?._id) return;
        const existing = String(notesById[row._id] || "");
        setNoteModal({ open: true, row, value: existing });
    };

    const closeNoteModal = () => {
        setNoteModal({ open: false, row: null, value: "" });
    };

    const saveNote = () => {
        const id = noteModal.row?._id;
        if (!id) return;
        const next = String(noteModal.value || "").trim();
        setNotesById((prev) => ({ ...prev, [id]: next }));
        closeNoteModal();
    };

    const applyQuickNote = (text) => {
        const t = String(text || "").trim();
        if (!t) return;
        setNoteModal((prev) => {
            const cur = String(prev.value || "").trim();
            if (!cur) return { ...prev, value: t };
            if (cur.includes(t)) return prev;
            return { ...prev, value: `${cur}\n${t}` };
        });
    };

    const visibleDaily = useMemo(() => {
        const list = Array.isArray(daily) ? daily : [];
        return list.filter((r) => !hiddenIds?.[r?._id]);
    }, [daily, hiddenIds]);

    const dailyTotal = visibleDaily.length;
    const dailyTotalPages = Math.max(1, Math.ceil(dailyTotal / DAILY_PAGE_SIZE));
    const dailyPageSafe = Math.min(Math.max(1, dailyPage), dailyTotalPages);
    const dailyStartIdx = dailyTotal === 0 ? 0 : (dailyPageSafe - 1) * DAILY_PAGE_SIZE;
    const dailyEndIdxExclusive = Math.min(dailyStartIdx + DAILY_PAGE_SIZE, dailyTotal);
    const dailySlice = dailyTotal === 0 ? [] : visibleDaily.slice(dailyStartIdx, dailyEndIdxExclusive);

    useEffect(() => {
        if (dailyPage > dailyTotalPages) {
            setDailyPage(1);
        }
    }, [dailyTotalPages, dailyPage]);

    const getPageItems = (totalPages, current) => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const items = [];
        const add = (x) => items.push(x);

        add(1);

        const left = Math.max(2, current - 1);
        const right = Math.min(totalPages - 1, current + 1);

        if (left > 2) add("ellipsis-left");
        for (let p = left; p <= right; p++) add(p);
        if (right < totalPages - 1) add("ellipsis-right");

        add(totalPages);
        return items;
    };

    const loadTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get("/kitchen/receiving-tasks");
            const payload = res.data || {};
            setDateText(payload?.date || "");
            setDaily(Array.isArray(payload?.daily) ? payload.daily : []);
            setOther(Array.isArray(payload?.other) ? payload.other : []);

            const nextReceived = {};
            [...(payload?.daily || []), ...(payload?.other || [])].forEach((r) => {
                if (!r?._id) return;
                nextReceived[r._id] = "0";
            });
            setReceivedById(nextReceived);
        } catch (e) {
            console.error(e);
            setDaily([]);
            setOther([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleConfirm = async () => {
        if (confirming) return;

        const rows = [...(daily || []), ...(other || [])];
        const missing = [];
        const normalizedRows = rows
            .map((r) => {
                const ingredientId = r?._id;
                if (!ingredientId) return null;
                const raw = receivedById?.[ingredientId];
                const note = notesById?.[ingredientId] || "";
                if (raw === undefined || raw === null || raw === "") {
                    missing.push(r?.name || "");
                    return null;
                }
                const qty = Number(raw);
                if (!Number.isFinite(qty) || qty < 0) {
                    missing.push(r?.name || "");
                    return null;
                }
                return {
                    ingredientId,
                    receivedQty: qty,
                    suggestedQty: r?.suggestedQty,
                    note,
                    name: r?.name || "",
                };
            })
            .filter(Boolean);

        if (missing.length > 0) {
            alert("Vui lòng nhập SL thực nhận hợp lệ cho: " + missing.filter(Boolean).slice(0, 5).join(", "));
            return;
        }

        const hasAnyPositive = normalizedRows.some((x) => Number(x.receivedQty) > 0);
        if (!hasAnyPositive) {
            alert("Vui lòng nhập ít nhất 1 nguyên liệu có SL thực nhận > 0");
            return;
        }

        const submittedIds = normalizedRows
            .filter((x) => Number(x.receivedQty) > 0)
            .map((x) => String(x.ingredientId));

        const items = normalizedRows.map((x) => ({
            ingredientId: x.ingredientId,
            receivedQty: x.receivedQty,
            suggestedQty: x.suggestedQty,
            note: x.note,
        }));

        setConfirming(true);
        try {
            await api.post("/kitchen/receiving-confirm", { items });
            const reset = {};
            rows.forEach((r) => {
                if (!r?._id) return;
                reset[r._id] = "0";
            });
            setReceivedById(reset);
            setNotesById({});
            if (submittedIds.length > 0) {
                setHiddenIds((prev) => {
                    const next = { ...(prev || {}) };
                    submittedIds.forEach((id) => {
                        next[id] = true;
                    });
                    return next;
                });
            }
            await loadTasks();
        } catch (e) {
            console.error(e);
            alert("Lỗi khi xác nhận nhập hàng: " + (e.response?.data?.error || e.message));
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-gray-500">Nhận hàng bếp</div>
                        <div className="text-lg font-semibold text-gray-900">Nhập hàng bếp</div>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/kitchen")}
                        className="relative px-5 py-3 rounded-2xl bg-rose-200 text-gray-900 font-semibold hover:bg-rose-300 transition-colors"
                    >
                        Màn hình bếp
                    </button>
                </div>

                <div className="mt-2 text-sm text-gray-600">Ngày: {dateText || nowText}</div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-200 p-4">
                        <div className="text-xs text-gray-500">Cần nhập hôm nay</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">
                            {daily.length + other.length} mặt hàng
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4">
                        <div className="text-xs text-gray-500">Đã hoàn thành</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">0 / {daily.length + other.length}</div>
                        <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-2 bg-emerald-500" style={{ width: "0%" }} />
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4">
                        <div className="text-xs text-gray-500">Chờ nhập</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">{daily.length + other.length} mặt hàng</div>
                    </div>
                </div>

                <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="text-sm font-semibold text-gray-900">Danh sách nhập hàng hôm nay</div>
                    </div>

                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-600">
                                        <th className="text-left font-medium px-4 py-3">Tên nguyên liệu</th>
                                        <th className="text-left font-medium px-4 py-3">Lý do nhập</th>
                                        <th className="text-left font-medium px-4 py-3">ĐVT</th>
                                        <th className="text-center font-medium px-4 py-3">SL đề nghị</th>
                                        <th className="text-center font-medium px-4 py-3">SL thực nhận</th>
                                        <th className="text-center font-medium px-4 py-3">Trạng thái / Chênh lệch</th>
                                        <th className="text-center font-medium px-4 py-3">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td className="px-4 py-4 text-gray-500" colSpan={7}>
                                                Đang tải...
                                            </td>
                                        </tr>
                                    ) : daily.length === 0 ? (
                                        <tr>
                                            <td className="px-4 py-4 text-gray-500" colSpan={7}>
                                                Không có nguyên liệu nhận mỗi ngày.
                                            </td>
                                        </tr>
                                    ) : (
                                        dailySlice.map((row) => {
                                            const received = receivedById[row._id];
                                            const status = calcStatus(row?.suggestedQty, received);
                                            const hasNote = !!String(notesById[row._id] || "").trim();
                                            return (
                                                <tr key={row._id} className="border-t border-gray-200">
                                                    <td className="px-4 py-3 font-semibold text-gray-900">
                                                        {row.name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs ${reasonBadgeClass(row)}`}>
                                                            {reasonLabel(row)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700">{row.displayUnit}</td>
                                                    <td className="px-4 py-3 text-center text-gray-700">
                                                        {formatQty(row.suggestedQty)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            value={receivedById[row._id] ?? ""}
                                                            onChange={(e) =>
                                                                setReceivedById((prev) => ({
                                                                    ...prev,
                                                                    [row._id]: e.target.value,
                                                                }))
                                                            }
                                                            className="w-28 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-center"
                                                            placeholder="Nhập SL..."
                                                        />
                                                    </td>
                                                    <td className={`px-4 py-3 text-center ${status.cls}`}>{status.text}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => openNoteModal(row)}
                                                            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${
                                                                hasNote
                                                                    ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                                            }`}
                                                            aria-label="Ghi chú"
                                                        >
                                                            <svg
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                className="w-5 h-5"
                                                                aria-hidden="true"
                                                            >
                                                                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {!loading && dailyTotal > DAILY_PAGE_SIZE && (
                            <div className="mt-4 flex items-center justify-between text-sm">
                                <div className="text-gray-500">
                                    Đang hiển thị {dailyStartIdx + 1}-{dailyEndIdxExclusive} trên tổng {dailyTotal} nguyên liệu
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDailyPage((p) => Math.max(1, p - 1))}
                                        disabled={dailyPageSafe === 1}
                                        className="w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white flex items-center justify-center"
                                        aria-label="Trang trước"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
                                            <path d="M15 18l-6-6 6-6" />
                                        </svg>
                                    </button>

                                    {getPageItems(dailyTotalPages, dailyPageSafe).map((it) => {
                                        if (String(it).startsWith("ellipsis")) {
                                            return (
                                                <div key={it} className="w-10 h-10 flex items-center justify-center text-gray-500">
                                                    …
                                                </div>
                                            );
                                        }
                                        const active = it === dailyPageSafe;
                                        return (
                                            <button
                                                key={it}
                                                type="button"
                                                onClick={() => setDailyPage(it)}
                                                className={`w-10 h-10 rounded-xl border flex items-center justify-center font-semibold transition-colors ${
                                                    active
                                                        ? "border-blue-200 bg-blue-50 text-blue-700"
                                                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                                }`}
                                            >
                                                {it}
                                            </button>
                                        );
                                    })}

                                    <button
                                        type="button"
                                        onClick={() => setDailyPage((p) => Math.min(dailyTotalPages, p + 1))}
                                        disabled={dailyPageSafe === dailyTotalPages}
                                        className="w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white flex items-center justify-center"
                                        aria-label="Trang sau"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
                                            <path d="M9 18l6-6-6-6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="text-sm font-semibold text-gray-900">
                            Danh sách hàng nhập theo chu kỳ và sắp hết
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-600">
                                        <th className="text-left font-medium px-4 py-3">Tên nguyên liệu</th>
                                        <th className="text-left font-medium px-4 py-3">Lý do nhập</th>
                                        <th className="text-left font-medium px-4 py-3">ĐVT</th>
                                        <th className="text-center font-medium px-4 py-3">SL hiện tại</th>
                                        <th className="text-center font-medium px-4 py-3">SL thực nhận</th>
                                        <th className="text-center font-medium px-4 py-3">Trạng thái / Chênh lệch</th>
                                        <th className="text-center font-medium px-4 py-3">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td className="px-4 py-4 text-gray-500" colSpan={7}>
                                                Đang tải...
                                            </td>
                                        </tr>
                                    ) : other.length === 0 ? (
                                        <tr>
                                            <td className="px-4 py-4 text-gray-500" colSpan={7}>
                                                Không có hàng theo chu kỳ hoặc sắp hết.
                                            </td>
                                        </tr>
                                    ) : (
                                        other.filter((r) => !hiddenIds?.[r?._id]).map((row) => {
                                            const received = receivedById[row._id];
                                            const status = calcStatus(row?.suggestedQty, received);
                                            const hasNote = !!String(notesById[row._id] || "").trim();
                                            return (
                                                <tr key={row._id} className="border-t border-gray-200">
                                                    <td className="px-4 py-3 font-semibold text-gray-900">
                                                        {row.name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs ${reasonBadgeClass(row)}`}>
                                                            {reasonLabel(row)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700">{row.displayUnit}</td>
                                                    <td className="px-4 py-3 text-center text-gray-700">
                                                        {formatQty(row.currentQty)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            value={receivedById[row._id] ?? ""}
                                                            onChange={(e) =>
                                                                setReceivedById((prev) => ({
                                                                    ...prev,
                                                                    [row._id]: e.target.value,
                                                                }))
                                                            }
                                                            className="w-28 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-center"
                                                            placeholder="Nhập SL..."
                                                        />
                                                    </td>
                                                    <td className={`px-4 py-3 text-center ${status.cls}`}>{status.text}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => openNoteModal(row)}
                                                            className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${
                                                                hasNote
                                                                    ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                                            }`}
                                                            aria-label="Ghi chú"
                                                        >
                                                            <svg
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                className="w-5 h-5"
                                                                aria-hidden="true"
                                                            >
                                                                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                                                            </svg>
                                                        </button>
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

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/kitchen")}
                        className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={confirming}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-60"
                    >
                        {confirming ? "Đang xác nhận..." : "Xác nhận nhập hàng"}
                    </button>
                </div>
            </div>

            {noteModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                            <div className="text-lg font-semibold text-gray-900">Ghi chú nhập hàng</div>
                            <button
                                type="button"
                                onClick={closeNoteModal}
                                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-2xl"
                                aria-label="Đóng"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-6 h-6"
                                        aria-hidden="true"
                                    >
                                        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                                    </svg>
                                </div>
                                <div className="font-semibold text-gray-900">{noteModal.row?.name}</div>
                            </div>

                            <div className="mt-5">
                                <div className="text-sm font-semibold text-gray-900">Nội dung ghi chú</div>
                                <textarea
                                    value={noteModal.value}
                                    onChange={(e) => setNoteModal((prev) => ({ ...prev, value: e.target.value }))}
                                    className="mt-3 w-full min-h-36 rounded-2xl border border-gray-200 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    placeholder="Nhập ghi chú..."
                                />
                            </div>

                            <div className="mt-5">
                                <div className="text-sm font-semibold text-gray-900">Gợi ý nhanh:</div>
                                <div className="mt-3 flex flex-wrap gap-3">
                                    {["Hàng hư hỏng", "Sai quy cách", "Thiếu hàng từ NCC", "Hàng cận date"].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => applyQuickNote(t)}
                                            className="px-4 py-2 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-sm text-gray-700"
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeNoteModal}
                                className="px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={saveNote}
                                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                            >
                                Lưu ghi chú
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default KitchenReceiving;
