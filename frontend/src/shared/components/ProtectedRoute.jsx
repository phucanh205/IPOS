import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@features/auth/context/AuthContext";

function ProtectedRoute({ children, allowedRoles, redirectTo = "/home" }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  const getDefaultPath = (role) => {
    if (role === "cashier") return "/home";
    if (role === "admin") return "/dashboard";
    if (role === "kitchen") return "/kitchen";
    return "/home";
  };

  // Wait for auth check to complete
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      const roleDefault = getDefaultPath(user?.role);
      const requestedPath = String(location?.pathname || "");
      let target = String(redirectTo || "").trim() || roleDefault || "/login?force=1";

      if (String(target).startsWith("/login") && roleDefault) {
        target = roleDefault;
      }

      // Avoid redirect loops (e.g. redirectTo equals the same protected path)
      if (target === requestedPath) {
        target = roleDefault && roleDefault !== requestedPath ? roleDefault : "/login?force=1";
      }

      return <Navigate to={target} replace />;
    }
  }

  return children;
}

export default ProtectedRoute;


