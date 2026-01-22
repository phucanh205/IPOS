import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import DateTimeDisplay from "../components/DateTimeDisplay";
import { createIngredient, deleteIngredient, getIngredients, updateIngredient } from "../services/api";

const DISPLAY_UNIT_OPTIONS = [
    { value: "pcs", label: "Chiếc" },
    { value: "kg", label: "Kg" },
    { value: "box", label: "Hộp" },
    { value: "custom", label: "Khác..." },
];

const BASE_UNIT_OPTIONS = [
    { value: "pcs", label: "pcs" },
    { value: "g", label: "g" },
    { value: "ml", label: "ml" },
];

const ISSUE_RULE_OPTIONS = [
    { value: "daily", label: "Nhận mỗi ngày" },
    { value: "long_storage", label: "Tồn kho dài ngày" },
    { value: "cycle", label: "Theo chu kỳ" },
];

const MEASURABLE_UNIT_DEFAULTS = {
    kg: { baseUnit: "g", conversionFactor: "1000" },
    g: { baseUnit: "g", conversionFactor: "1" },
    l: { baseUnit: "ml", conversionFactor: "1000" },
    ml: { baseUnit: "ml", conversionFactor: "1" },
};

const normalizeUnitKey = (u) => String(u || "").trim().toLowerCase();
const isMeasurableUnit = (u) => {
    const key = normalizeUnitKey(u);
    return !!MEASURABLE_UNIT_DEFAULTS[key];
};
const getMeasurableDefaults = (u) => {
    const key = normalizeUnitKey(u);
    return MEASURABLE_UNIT_DEFAULTS[key] || null;
};

const displayUnitLabel = (unit) =>
    DISPLAY_UNIT_OPTIONS.find((u) => u.value === unit)?.label || unit || "";
const issueRuleLabel = (rule) => ISSUE_RULE_OPTIONS.find((r) => r.value === rule)?.label || rule || "";

function Ingredients() {
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [ingredients, setIngredients] = useState([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(null);

    const [deleteModal, setDeleteModal] = useState({ open: false, ing: null });
    const [deleting, setDeleting] = useState(false);

    const [name, setName] = useState("");
    const [group, setGroup] = useState("");
    const [supplierName, setSupplierName] = useState("");
    const [displayUnit, setDisplayUnit] = useState("");
    const [customDisplayUnit, setCustomDisplayUnit] = useState("");
    const [baseUnit, setBaseUnit] = useState("");
    const [conversionFactor, setConversionFactor] = useState("");
    const [issueRule, setIssueRule] = useState("");
    const [stockOnHand, setStockOnHand] = useState("");
    const [cycleDays, setCycleDays] = useState("");
    const [nextReceiveDate, setNextReceiveDate] = useState("");

    const effectiveDisplayUnit =
        displayUnit === "custom" ? String(customDisplayUnit || "").trim() : displayUnit;

    const applyUnitDefaults = (nextDisplayUnit) => {
        const u = normalizeUnitKey(nextDisplayUnit);
        const measurableDefaults = getMeasurableDefaults(u);
        if (measurableDefaults) {
            setBaseUnit(measurableDefaults.baseUnit);
            setConversionFactor(measurableDefaults.conversionFactor);
            return;
        }
        if (u) {
            setBaseUnit("pcs");
            setConversionFactor("1");
        }
    };

    const showConversionFields = isMeasurableUnit(effectiveDisplayUnit);

    useEffect(() => {
        load();
    }, []);

    const load = async (q = search) => {
        setLoading(true);
        try {
            const data = await getIngredients(q);
            setIngredients(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading ingredients:", error);
            setIngredients([]);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const q = String(search || "").trim().toLowerCase();
        if (!q) return ingredients;
        return (ingredients || []).filter((i) => {
            const hay = `${i?.name || ""} ${i?.group || ""} ${i?.supplierName || ""}`.toLowerCase();
            return hay.includes(q);
        });
    }, [ingredients, search]);

    const openNew = () => {
        setEditing(null);
        setName("");
        setGroup("");
        setSupplierName("");
        setDisplayUnit("");
        setCustomDisplayUnit("");
        setBaseUnit("");
        setConversionFactor("");
        setIssueRule("");
        setStockOnHand("");
        setCycleDays("");
        setNextReceiveDate("");
        setModalOpen(true);
    };

    const openEdit = (ing) => {
        setEditing(ing);
        setName(ing?.name || "");
        setGroup(ing?.group || "");
        setSupplierName(ing?.supplierName || "");
        const ingDisplayUnit = String(ing?.displayUnit || ing?.unit || "").trim();
        const isKnown = ["pcs", "kg", "box"].includes(String(ingDisplayUnit).toLowerCase());
        setDisplayUnit(isKnown ? String(ingDisplayUnit).toLowerCase() : "custom");
        setCustomDisplayUnit(isKnown ? "" : ingDisplayUnit);
        setBaseUnit(String(ing?.baseUnit || ""));
        setConversionFactor(
            ing?.conversionFactor === 0 || ing?.conversionFactor
                ? String(ing.conversionFactor)
                : ""
        );

        const factor = Number(
            ing?.conversionFactor === 0 || ing?.conversionFactor ? ing.conversionFactor : 1
        );
        const baseQty = Number(ing?.stockOnHand) || 0;
        const displayQty = factor > 0 ? baseQty / factor : baseQty;
        setStockOnHand(
            ing?.stockOnHand === 0 || ing?.stockOnHand ? String(displayQty) : ""
        );
        setCycleDays(ing?.cycleDays === 0 || ing?.cycleDays ? String(ing.cycleDays) : "");
        setNextReceiveDate(
            ing?.nextReceiveDate ? String(ing.nextReceiveDate).slice(0, 10) : ""
        );
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;
        setModalOpen(false);
    };

    const openDeleteModal = (ing) => {
        setDeleteModal({ open: true, ing });
    };

    const closeDeleteModal = () => {
        if (deleting) return;
        setDeleteModal({ open: false, ing: null });
    };

    const confirmDelete = async () => {
        const ing = deleteModal.ing;
        if (!ing?._id || deleting) return;
        setDeleting(true);
        try {
            await deleteIngredient(ing._id);
            await load();
            setDeleteModal({ open: false, ing: null });
        } catch (error) {
            console.error("Error deleting ingredient:", error);
            alert(
                "Lỗi khi xóa nguyên liệu: " +
                    (error.response?.data?.error || error.message)
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleSave = async () => {
        if (saving) return;

        const trimmedName = String(name || "").trim();
        const trimmedGroup = String(group || "").trim();
        const trimmedSupplier = String(supplierName || "").trim();
        if (!trimmedName) {
            alert("Vui lòng nhập tên nguyên liệu");
            return;
        }
        if (!trimmedGroup) {
            alert("Vui lòng nhập nhóm nguyên liệu");
            return;
        }
        if (!trimmedSupplier) {
            alert("Vui lòng nhập nhà cung cấp");
            return;
        }
        if (!effectiveDisplayUnit) {
            alert("Vui lòng chọn đơn vị tính");
            return;
        }

        const resolvedBaseUnit = showConversionFields ? baseUnit : "pcs";
        const resolvedFactor = showConversionFields ? conversionFactor : "1";

        if (!resolvedBaseUnit) {
            alert("Vui lòng chọn đơn vị gốc");
            return;
        }
        const factorNum = Number(resolvedFactor);
        if (resolvedFactor === "" || Number.isNaN(factorNum) || factorNum <= 0) {
            alert("Vui lòng nhập hệ số quy đổi hợp lệ");
            return;
        }
        if (!issueRule) {
            alert("Vui lòng chọn quy tắc cấp phát");
            return;
        }

        const qtyNum = Number(stockOnHand);
        if (stockOnHand === "" || Number.isNaN(qtyNum) || qtyNum < 0) {
            alert("Vui lòng nhập số lượng hợp lệ");
            return;
        }

        if (issueRule === "cycle") {
            const cd = cycleDays === "" ? null : Number(cycleDays);
            const hasCycleDays = cd !== null && !Number.isNaN(cd) && cd > 0;
            const hasDate = !!String(nextReceiveDate || "").trim();
            if (!hasCycleDays && !hasDate) {
                alert("Theo chu kỳ: cần nhập chu kỳ (ngày) hoặc chọn ngày nhận hàng");
                return;
            }
        }

        const payload = {
            name: trimmedName,
            group: trimmedGroup,
            supplierName: trimmedSupplier,
            unit: effectiveDisplayUnit,
            displayUnit: effectiveDisplayUnit,
            baseUnit: resolvedBaseUnit,
            conversionFactor: factorNum,
            issueRule,
        };

        payload.stockOnHand = qtyNum;

        if (issueRule === "cycle") {
            payload.cycleDays = cycleDays === "" ? null : Number(cycleDays);
            payload.nextReceiveDate = nextReceiveDate ? nextReceiveDate : null;
        }

        setSaving(true);
        try {
            if (editing?._id) {
                await updateIngredient(editing._id, payload);
            } else {
                await createIngredient(payload);
            }
            await load();
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving ingredient:", error);
            alert(
                "Lỗi khi lưu nguyên liệu: " +
                    (error.response?.data?.error || error.message)
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="flex h-screen bg-gray-100">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-full max-w-xl">
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Tìm theo tên nguyên liệu, nhóm"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => load()}
                                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium"
                                >
                                    Lọc
                                </button>
                                <button
                                    type="button"
                                    onClick={openNew}
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                                >
                                    + Thêm nguyên liệu mới
                                </button>
                            </div>
                            <DateTimeDisplay />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-200">
                                <div className="text-base font-semibold text-gray-900">
                                    Danh sách nguyên liệu
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="text-left font-medium px-5 py-3">Tên nguyên liệu</th>
                                            <th className="text-left font-medium px-5 py-3">Nhóm</th>
                                            <th className="text-left font-medium px-5 py-3">Tồn kho</th>
                                            <th className="text-left font-medium px-5 py-3">Nhà cung cấp</th>
                                            <th className="text-left font-medium px-5 py-3">Quy tắc cấp phát</th>
                                            <th className="text-center font-medium px-5 py-3">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-5 py-10 text-center text-gray-400"
                                                >
                                                    Đang tải...
                                                </td>
                                            </tr>
                                        ) : filtered.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-5 py-10 text-center text-gray-400"
                                                >
                                                    Không có nguyên liệu
                                                </td>
                                            </tr>
                                        ) : (
                                            filtered.map((i) => (
                                                <tr key={i._id} className="hover:bg-gray-50">
                                                    <td className="px-5 py-3 font-medium text-gray-900">
                                                        {i.name}
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-600">{i.group || ""}</td>
                                                    <td className="px-5 py-3 text-gray-600">
                                                        {new Intl.NumberFormat("vi-VN").format(
                                                            (() => {
                                                                const factor = Number(i?.conversionFactor) || 1;
                                                                const baseQty = Number(i.stockOnHand) || 0;
                                                                const displayQty = factor > 0 ? baseQty / factor : baseQty;
                                                                return displayQty;
                                                            })()
                                                        )}{" "}
                                                        {displayUnitLabel(i?.displayUnit || i.unit)}
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-600">
                                                        {i.supplierName || ""}
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-600">
                                                        {issueRuleLabel(i.issueRule)}
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEdit(i)}
                                                                className="px-6 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium"
                                                            >
                                                                Chỉnh sửa
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteModal(i)}
                                                                className="px-6 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium"
                                                            >
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                            <div className="text-xl font-semibold text-gray-900">
                                {editing ? "Chỉnh sửa nguyên liệu" : "Thêm nguyên liệu mới"}
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Tên nguyên liệu</div>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nhập tên nguyên liệu (VD: Thịt bò, Cà chua...)"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Nhóm nguyên liệu</div>
                                    <input
                                        value={group}
                                        onChange={(e) => setGroup(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Nhà cung cấp</div>
                                    <input
                                        value={supplierName}
                                        onChange={(e) => setSupplierName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Đơn vị tính</div>
                                    <select
                                        value={displayUnit}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setDisplayUnit(v);
                                            if (v !== "custom") {
                                                setCustomDisplayUnit("");
                                                applyUnitDefaults(v);
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    >
                                        <option value="">Chọn đơn vị</option>
                                        {DISPLAY_UNIT_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>

                                    {displayUnit === "custom" && (
                                        <input
                                            value={customDisplayUnit}
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                setCustomDisplayUnit(next);
                                                applyUnitDefaults(next);
                                            }}
                                            placeholder="Nhập đơn vị (vd: lít, chai, gói...)"
                                            className="mt-3 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        />
                                    )}
                                </div>

                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Quy tắc cấp phát</div>
                                    <select
                                        value={issueRule}
                                        onChange={(e) => setIssueRule(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    >
                                        <option value="">Chọn quy tắc</option>
                                        {ISSUE_RULE_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {showConversionFields && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">
                                            Đơn vị gốc (trừ kho)
                                        </div>
                                        <select
                                            value={baseUnit}
                                            onChange={(e) => setBaseUnit(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        >
                                            <option value="">Chọn đơn vị gốc</option>
                                            {BASE_UNIT_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Hệ số quy đổi</div>
                                        <input
                                            value={conversionFactor}
                                            onChange={(e) => setConversionFactor(e.target.value)}
                                            placeholder="vd: 1 kg = 1000 g"
                                            type="number"
                                            min="0"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        />

                                        {(() => {
                                            const qtyNum = Number(stockOnHand);
                                            const factorNum = Number(conversionFactor);
                                            const hasQty = stockOnHand !== "" && !Number.isNaN(qtyNum);
                                            const hasFactor = conversionFactor !== "" && !Number.isNaN(factorNum);
                                            if (!hasQty || !hasFactor || factorNum <= 0 || !baseUnit) return null;
                                            const baseAmount = qtyNum * factorNum;
                                            return (
                                                <div className="mt-2 text-xs text-gray-500">
                                                    {qtyNum} {effectiveDisplayUnit} = {baseAmount} {baseUnit}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="text-sm text-gray-600 mb-1">Số lượng</div>
                                <div className="flex items-center gap-2">
                                    <input
                                        value={stockOnHand}
                                        onChange={(e) => setStockOnHand(e.target.value)}
                                        placeholder="Điền số lượng (theo đơn vị)"
                                        type="number"
                                        min="0"
                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    />
                                    <div className="text-sm text-gray-500 min-w-[64px]">
                                        {effectiveDisplayUnit ? displayUnitLabel(effectiveDisplayUnit) : ""}
                                    </div>
                                </div>
                            </div>

                            {issueRule === "cycle" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">
                                            Điền chu kỳ nhận (ngày)
                                        </div>
                                        <input
                                            value={cycleDays}
                                            onChange={(e) => setCycleDays(e.target.value)}
                                            placeholder="vd: 2-3 ngày (Optional)"
                                            type="number"
                                            min="1"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">
                                            Hoặc chọn ngày nhận hàng
                                        </div>
                                        <input
                                            value={nextReceiveDate}
                                            onChange={(e) => setNextReceiveDate(e.target.value)}
                                            type="date"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {editing ? "Lưu" : "Thêm mới"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                            <div className="text-xl font-semibold text-gray-900">Xác nhận xóa</div>
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                disabled={deleting}
                                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-2xl disabled:opacity-60"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="text-sm text-gray-700">
                                Bạn có chắc muốn xóa nguyên liệu <span className="font-semibold">{deleteModal.ing?.name}</span> không?
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                                Hành động này không thể hoàn tác.
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                disabled={deleting}
                                className="px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
                            >
                                {deleting ? "Đang xóa..." : "Xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Ingredients;
