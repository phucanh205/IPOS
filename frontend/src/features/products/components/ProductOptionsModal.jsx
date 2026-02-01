import { useEffect, useMemo, useState } from "react";
import { getToppings } from "@shared/api/apiClient";

const SIZE_OPTIONS = [
    { id: "regular", label: "Vừa", extra: 0 },
    { id: "large", label: "Lớn", extra: 10000 },
];

const TOPPING_PRICE = 10000;

function ProductOptionsModal({ open, item, onClose, onSave }) {
    const [size, setSize] = useState("regular");
    const [toppings, setToppings] = useState([]);
    const [notes, setNotes] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [toppingOptions, setToppingOptions] = useState([]);

    const visibleToppingOptions = useMemo(() => {
        const set = new Set((toppingOptions || []).map((x) => x.id));
        const existing = Array.isArray(toppings) ? toppings : [];
        const extras = existing
            .filter((x) => x && !set.has(x))
            .map((x) => ({ id: x, label: x, extra: TOPPING_PRICE }));
        return [...(toppingOptions || []), ...extras];
    }, [toppingOptions, toppings]);

    useEffect(() => {
        if (item && open) {
            setSize(item.size || "regular");
            setToppings(item.toppings || []);
            setNotes(item.notes || "");
            setQuantity(item.quantity || 1);
        }
    }, [item, open]);

    useEffect(() => {
        if (!open) return;
        getToppings()
            .then((res) => {
                const list = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
                const normalized = list
                    .map((x) => ({
                        id: String(x?.name || "").trim(),
                        label: String(x?.name || "").trim(),
                        extra: TOPPING_PRICE,
                    }))
                    .filter((x) => x.id);
                setToppingOptions(normalized);
            })
            .catch((e) => {
                console.error(e);
                setToppingOptions([]);
            });
    }, [open]);

    if (!open || !item) return null;

    const toggleTopping = (id) => {
        setToppings((prev) =>
            prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
        );
    };

    const handleQuantityChange = (delta) => {
        setQuantity((prev) => Math.max(1, prev + delta));
    };

    const calculateTotal = () => {
        const sizeExtra = SIZE_OPTIONS.find((s) => s.id === size)?.extra ?? 0;
        const toppingExtra = (Array.isArray(toppings) ? toppings.length : 0) * TOPPING_PRICE;
        const unit = item.product.price + sizeExtra + toppingExtra;
        return unit * quantity;
    };

    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN").format(price) + " VND";

    const handleSave = () => {
        const sizeLabel =
            SIZE_OPTIONS.find((s) => s.id === size)?.label || "Vừa";
        const toppingLabels = Array.isArray(toppings) ? toppings : [];

        onSave({
            ...item,
            size,
            sizeLabel,
            toppings: toppingLabels,
            notes,
            quantity,
            totalPrice: calculateTotal(),
        });
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">
                            {item.product.name}
                        </h3>
                        <div className="text-xs text-gray-500 mt-1">
                            Giá cơ bản: {formatPrice(item.product.price)}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 text-xl"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
                    {/* Size */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-800">
                                Kích thước
                            </span>
                            <span className="text-xs text-red-500">
                                Bắt buộc
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {SIZE_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setSize(option.id)}
                                    className={`border rounded-xl px-3 py-2 text-xs flex flex-col items-center ${
                                        size === option.id
                                            ? "border-blue-500 bg-blue-50 text-blue-600"
                                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <span>{option.label}</span>
                                    <span className="mt-1 text-[11px] text-gray-500">
                                        {option.extra === 0
                                            ? "+0.00đ"
                                            : `+${formatPrice(option.extra)}`}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toppings */}
                    <div>
                        <div className="mb-2">
                            <span className="font-medium text-gray-800">
                                Topping thêm (Tùy chọn)
                            </span>
                        </div>
                        <div className="space-y-2">
                            {visibleToppingOptions.length === 0 ? (
                                <div className="text-xs text-gray-500">Chưa có topping.</div>
                            ) : (
                                visibleToppingOptions.map((topping) => {
                                const checked = toppings.includes(topping.id);
                                return (
                                    <label
                                        key={topping.id}
                                        className="flex items-center justify-between text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                    toggleTopping(topping.id)
                                                }
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                            />
                                            <span>{topping.label}</span>
                                        </div>
                                        <span className="text-gray-500">
                                            +{formatPrice(topping.extra)}
                                        </span>
                                    </label>
                                );
                                })
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <div className="mb-2">
                            <span className="font-medium text-gray-800">
                                Ghi chú đặc biệt
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ví dụ: Thêm phô mai, không hành"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
                    <div className="flex items-center border border-gray-200 rounded-full overflow-hidden text-sm">
                        <button
                            type="button"
                            onClick={() => handleQuantityChange(-1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-50"
                        >
                            −
                        </button>
                        <span className="w-8 text-center text-gray-800">
                            {quantity}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleQuantityChange(1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-50"
                        >
                            +
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex-1 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                        Thêm vào đơn {formatPrice(calculateTotal())}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductOptionsModal;
