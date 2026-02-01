import { useState } from "react";

function DateRangePicker({ onDateChange, startDate, endDate }) {
    const [isOpen, setIsOpen] = useState(false);

    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    const handleToday = () => {
        const today = new Date();
        onDateChange({
            startDate: today.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
        });
        setIsOpen(false);
    };

    const handleYesterday = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        onDateChange({
            startDate: yesterday.toISOString().split('T')[0],
            endDate: yesterday.toISOString().split('T')[0],
        });
        setIsOpen(false);
    };

    const handleThisWeek = () => {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        onDateChange({
            startDate: weekStart.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
        });
        setIsOpen(false);
    };

    const handleThisMonth = () => {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        onDateChange({
            startDate: monthStart.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
        });
        setIsOpen(false);
    };

    const handleClear = () => {
        onDateChange({ startDate: "", endDate: "" });
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
                <span className="text-sm text-gray-700">
                    {startDate && endDate
                        ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                        : "Chọn thời gian"}
                </span>
                <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Chọn thời gian</h3>
                        
                        {/* Quick Select */}
                        <div className="space-y-2 mb-4">
                            <button
                                onClick={handleToday}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Hôm nay
                            </button>
                            <button
                                onClick={handleYesterday}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Hôm qua
                            </button>
                            <button
                                onClick={handleThisWeek}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Tuần này
                            </button>
                            <button
                                onClick={handleThisMonth}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Tháng này
                            </button>
                        </div>

                        {/* Custom Date Range */}
                        <div className="border-t pt-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Từ ngày
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) =>
                                            onDateChange({
                                                ...{ startDate, endDate },
                                                startDate: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Đến ngày
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) =>
                                            onDateChange({
                                                ...{ startDate, endDate },
                                                endDate: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleClear}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Xóa
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Áp dụng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}

export default DateRangePicker;
