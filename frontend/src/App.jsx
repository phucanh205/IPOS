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
import ProtectedRoute from "./components/ProtectedRoute";

function AppRoutes() {
    const location = useLocation();
    const { isAuthenticated, isLoading } = useAuth();

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
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
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
                path="/"
                element={
                    <Navigate
                        to={isAuthenticated ? "/dashboard" : "/login"}
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
