import { Navigate } from "react-router-dom";

export default function AuthGuard({ children }) {
  const isAuthenticated = localStorage.getItem("society_auth") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
