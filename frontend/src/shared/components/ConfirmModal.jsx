function ConfirmModal({
    open,
    title = "Xác nhận",
    message = "Bạn chắc chắn muốn thực hiện hành động này?",
    warning = "Hành động này không thể hoàn tác.",
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    confirmColor = "red",
    onClose,
    onConfirm,
}) {
    if (!open) return null;

    const confirmButtonClass =
        confirmColor === "red"
            ? "bg-red-500 hover:bg-red-600"
            : confirmColor === "blue"
            ? "bg-blue-500 hover:bg-blue-600"
            : "bg-gray-500 hover:bg-gray-600";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                <div className="px-6 py-4 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                        Đóng
                    </button>
                </div>

                <div className="px-6 pb-6 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {title}
                    </h3>

                    <p className="text-gray-700 mb-1">{message}</p>

                    {warning && (
                        <p className="text-sm text-gray-500 mb-6">{warning}</p>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`flex-1 py-2.5 rounded-lg ${confirmButtonClass} text-white font-semibold`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
