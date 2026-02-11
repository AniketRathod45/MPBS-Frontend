import { Navigate } from "react-router-dom";

export default function AdminAuthGuard({ children }) {
  const isAuthenticated = localStorage.getItem("admin_auth") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}