import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const menuItems = [
        {
            icon: "📊",
            label: "Tổng quan",
            path: "/dashboard",
        },
        {
            icon: "▦",
            label: "POS",
            path: "/home",
        },
        {
            icon: "🍔",
            label: "Sản phẩm",
            path: "/products",
        },
        {
            icon: "💰",
            label: "Đơn tạm giữ",
            path: "/held-orders",
        },
        {
            icon: "🧾",
            label: "Đơn hàng",
            path: "/orders",
        },
    ];

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="w-20 bg-blue-50 flex flex-col items-center py-6 border-r border-gray-200">
            <div className="text-lg font-semibold text-gray-700 mb-8">Menu</div>

            <div className="flex flex-col gap-6">
                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <button
                            key={item.path}
                            type="button"
                            onClick={() => navigate(item.path)}
                            className={`w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                                isActive
                                    ? "bg-blue-500 text-white shadow-md"
                                    : "text-gray-600 hover:bg-blue-100"
                            }`}
                            title={item.label}
                        >
                            <span className="text-2xl">{item.icon}</span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-auto">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-12 h-12 rounded-lg flex items-center justify-center cursor-pointer text-gray-600 hover:bg-blue-100 transition-all"
                    title="Đăng xuất"
                >
                    <span className="text-2xl">←</span>
                </button>
            </div>
        </div>
    );
}

export default Sidebar;
