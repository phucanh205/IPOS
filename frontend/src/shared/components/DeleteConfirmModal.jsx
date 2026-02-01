import ConfirmModal from "./ConfirmModal";

function DeleteConfirmModal({ open, product, onClose, onConfirm }) {
    if (!open || !product) return null;

    return (
        <ConfirmModal
            open={open}
            title="Xác nhận xóa"
            message="Bạn chắc chắn muốn xóa món này không?"
            warning="Hành động này không thể hoàn tác."
            confirmText="Xóa"
            cancelText="Hủy"
            confirmColor="red"
            onClose={onClose}
            onConfirm={onConfirm}
        />
    );
}

export default DeleteConfirmModal;

