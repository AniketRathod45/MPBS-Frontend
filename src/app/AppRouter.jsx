import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ================= SOCIETY =================
import SocietyLogin from "../modules/society/Login";
import ForgotPassword from "../modules/society/ForgotPassword";
import Dashboard from "../modules/society/Dashboard";
import MilkCollection from "../modules/society/MilkCollection";
import RateSheet from "../modules/society/RateSheet";
import DispatchSheet from "../modules/society/DispatchSheet";
import Layout from "./layout/Layout";
import AuthGuard from "../shared/components/AuthGaurd";

// ================= ADMIN =================
import AdminLogin from "../modules/admin/Login";
import UserManagement from "../modules/admin/UserManagement";
import Requests from "../modules/admin/Requests";
import Notifications from "../modules/admin/Notifications";
import AdminLayout from "./layout/AdminLayout";
import AdminAuthGuard from "../shared/components/AdminAuthGaurd";

// ================= BMC =================
import BMCLogin from "../modules/bmc/Login";
import MilkVerification from "../modules/bmc/SocietyMilkVerification";
import BMCLayout from "./layout/BmcLayout";
import BMCAuthGuard from "../shared/components/BmcAuthGaurd";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= SOCIETY ROUTES ================= */}
        <Route path="/login" element={<SocietyLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/"
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="collection" element={<MilkCollection />} />
          <Route path="ratesheet" element={<RateSheet />} />
          <Route path="dispatch" element={<DispatchSheet />} />
        </Route>

        {/* ================= ADMIN ROUTES ================= */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <AdminAuthGuard>
              <AdminLayout />
            </AdminAuthGuard>
          }
        >
          <Route index element={<Navigate to="/admin/users" replace />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="requests" element={<Requests />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ================= BMC ROUTES ================= */}
        <Route path="/bmc/login" element={<BMCLogin />} />

        <Route
          path="/bmc"
          element={
            <BMCAuthGuard>
              <BMCLayout />
            </BMCAuthGuard>
          }
        >
          <Route path="verification" element={<MilkVerification />} />
        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
