import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const role = user?.role;
    const isAdmin = role === "admin";

    const adminMenuItems = [
        {
            icon: "📊",
            label: "Tổng quan",
            path: "/dashboard",
        },
        {
            icon: "🍔",
            label: "Danh sách sản phẩm",
            path: "/products",
        },
        {
            icon: "🥬",
            label: "Nguyên liệu",
            path: "/ingredients",
        },
        {
            icon: "🧾",
            label: "Lịch sử hóa đơn",
            path: "/orders",
        },
    ];

    const cashierMenuItems = [
        {
            icon: "▦",
            label: "POS",
            path: "/home",
        },
        {
            icon: "🍔",
            label: "Danh sách sản phẩm",
            path: "/products",
        },
        {
            icon: "💰",
            label: "Đơn hàng tạm giữ",
            path: "/held-orders",
        },
        {
            icon: "🧾",
            label: "Lịch sử hóa đơn",
            path: "/orders",
        },
    ];

    const visibleMenuItems = isAdmin ? adminMenuItems : cashierMenuItems;

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="w-64 bg-gray-900 flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
                <div className="text-xl font-bold text-white">
                    {user?.role === "admin" ? "IPOS ADMIN" : "IPOS"}
                </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 py-4">
                {visibleMenuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <button
                            key={item.path}
                            type="button"
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-6 py-3 transition-all ${
                                isActive
                                    ? "bg-blue-600 text-white border-l-4 border-blue-400"
                                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Logout */}
            <div className="p-4 border-t border-gray-800">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-all rounded-lg"
                >
                    <span className="text-lg">←</span>
                    <span className="font-medium">Đăng xuất</span>
                </button>
            </div>
        </div>
    );
}

export default Sidebar;
