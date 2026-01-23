import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Products from "./pages/Products";
import HeldOrders from "./pages/HeldOrders";
import Orders from "./pages/Orders";
import Dashboard from "./pages/Dashboard";
import Kitchen from "./pages/Kitchen";
import KitchenReceiving from "./pages/KitchenReceiving";
import Ingredients from "./pages/Ingredients";
import Recipes from "./pages/Recipes";
import AdminReceiving from "./pages/AdminReceiving";
import ProtectedRoute from "./components/ProtectedRoute";

function AppRoutes() {
    const location = useLocation();
    const { isAuthenticated, isLoading, user } = useAuth();

    const forceLogin = new URLSearchParams(location.search).get("force") === "1";

    const getDefaultPath = () => {
        if (user?.role === "cashier") return "/home";
        if (user?.role === "admin") return "/dashboard";
        if (user?.role === "kitchen") return "/kitchen";
        return "/home";
    };

    // If loading auth, show loading screen
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-500">Đang tải...</div>
            </div>
        );
    }

    // If authenticated and on login page, redirect to dashboard (unless forced)
    if (isAuthenticated && location.pathname === "/login" && !forceLogin) {
        return <Navigate to={getDefaultPath()} replace />;
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["admin"]} redirectTo="/login?force=1">
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/home"
                element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/products"
                element={
                    <ProtectedRoute>
                        <Products />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/ingredients"
                element={
                    <ProtectedRoute allowedRoles={["admin"]} redirectTo="/login?force=1">
                        <Ingredients />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/recipes"
                element={
                    <ProtectedRoute allowedRoles={["admin"]} redirectTo="/login?force=1">
                        <Recipes />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/receiving"
                element={
                    <ProtectedRoute allowedRoles={["admin"]} redirectTo="/login?force=1">
                        <AdminReceiving />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/held-orders"
                element={
                    <ProtectedRoute>
                        <HeldOrders />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/orders"
                element={
                    <ProtectedRoute>
                        <Orders />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/kitchen"
                element={
                    <ProtectedRoute
                        allowedRoles={["kitchen"]}
                        redirectTo="/login?force=1"
                    >
                        <Kitchen />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/kitchen/receiving"
                element={
                    <ProtectedRoute
                        allowedRoles={["kitchen"]}
                        redirectTo="/login?force=1"
                    >
                        <KitchenReceiving />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/"
                element={
                    <Navigate to="/login?force=1" replace />
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

export default App;
