import { Navigate } from "react-router-dom";

export default function DairyAuthGuard({ children }) {
  const isDairySession = localStorage.getItem("dairy_auth") === "true";
  const role = localStorage.getItem("user_role");
  const token = localStorage.getItem("auth_token");
  const isAuthenticated = isDairySession && role === "Dairy" && Boolean(token);

  if (!isAuthenticated) {
    // Prevent stale cross-role flags from allowing access to Dairy pages.
    localStorage.removeItem("dairy_auth");
    localStorage.removeItem("dairy_name");
    localStorage.removeItem("dairy_id");
    return <Navigate to="/login/dairy" replace />;
  }

  return children;
}
