import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@features/auth/context/AuthContext";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const isIngredientsSectionActive =
        location.pathname.startsWith("/ingredients") ||
        location.pathname.startsWith("/recipes");
    const [ingredientsOpen, setIngredientsOpen] = useState(
        isIngredientsSectionActive
    );

    const role = user?.role;
    const isAdmin = role === "admin";

    const adminMenuItems = [
        {
            label: "Tổng quan",
            path: "/dashboard",
        },
        {
            label: "Quản lý nhập hàng",
            path: "/admin/receiving",
        },
        {
            label: "Danh sách sản phẩm",
            path: "/products",
        },
        {
            label: "Lịch sử hóa đơn",
            path: "/orders",
        },
    ];

    const cashierMenuItems = [
        {

            label: "POS",
            path: "/home",
        },
        {

            label: "Danh sách sản phẩm",
            path: "/products",
        },
        {
    
            label: "Đơn hàng tạm giữ",
            path: "/held-orders",
        },
        {

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
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}

                {isAdmin && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setIngredientsOpen((v) => !v)}
                            className={`w-full flex items-center justify-between gap-3 px-6 py-3 transition-all ${
                                isIngredientsSectionActive
                                    ? "bg-blue-600 text-white border-l-4 border-blue-400"
                                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <span className="font-medium">Quản lý định mức</span>
                            </span>
                            <span className="text-lg">{ingredientsOpen ? "˄" : "˅"}</span>
                        </button>

                        {ingredientsOpen && (
                            <div className="pl-8">
                                <button
                                    type="button"
                                    onClick={() => navigate("/ingredients")}
                                    className={`w-full flex items-center gap-3 px-6 py-3 transition-all ${
                                        location.pathname.startsWith("/ingredients")
                                            ? "bg-blue-600 text-white border-l-4 border-blue-400"
                                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    }`}
                                >
                                    <span className="font-medium">Nguyên liệu</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate("/recipes")}
                                    className={`w-full flex items-center gap-3 px-6 py-3 transition-all ${
                                        location.pathname.startsWith("/recipes")
                                            ? "bg-blue-600 text-white border-l-4 border-blue-400"
                                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    }`}
                                >
                                    <span className="font-medium">Công thức</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
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
