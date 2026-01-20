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
import Ingredients from "./pages/Ingredients";
import Recipes from "./pages/Recipes";
import ProtectedRoute from "./components/ProtectedRoute";

function AppRoutes() {
    const location = useLocation();
    const { isAuthenticated, isLoading, user } = useAuth();

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

    // If authenticated and on login page, redirect to dashboard
    if (isAuthenticated && location.pathname === "/login") {
        return <Navigate to={getDefaultPath()} replace />;
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute allowedRoles={["admin"]} redirectTo="/dashboard">
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
                    <ProtectedRoute allowedRoles={["admin"]} redirectTo="/ingredients">
                        <Ingredients />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/recipes"
                element={
                    <ProtectedRoute allowedRoles={["admin"]} redirectTo="/recipes">
                        <Recipes />
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
                        redirectTo="/kitchen"
                    >
                        <Kitchen />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/"
                element={
                    <Navigate
                        to={isAuthenticated ? getDefaultPath() : "/login"}
                        replace
                    />
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
