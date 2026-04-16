const rawApiBase = (import.meta.env.VITE_API_BASE || "").trim();
const API_BASE = (rawApiBase || "http://localhost:4000").replace(/\/+$/, "");
let authFailureHandled = false;

function backendUnavailableMessage() {
  return `Cannot reach backend at ${API_BASE}. Ensure the backend is running and VITE_API_BASE is correct.`;
}

function getToken() {
  return localStorage.getItem("auth_token") || "";
}

function clearAuthSession() {
  const keys = [
    "auth_token",
    "user_role",
    "user_id",
    "admin_auth",
    "admin_name",
    "society_auth",
    "society_name",
    "society_id",
    "bmc_auth",
    "bmc_name",
    "bmc_id",
    "dairy_auth",
    "dairy_name",
    "dairy_id",
    "dairy_unit",
  ];
  keys.forEach((key) => localStorage.removeItem(key));
}

function resolveLoginPath() {
  const path = window.location.pathname.toLowerCase();
  const role = String(localStorage.getItem("user_role") || "").toLowerCase();

  if (path.startsWith("/admin") || role === "admin") return "/admin/login";
  if (path.startsWith("/bmc") || role === "bmc") return "/bmc/login";
  if (path.startsWith("/dairy") || role === "dairy") return "/login/dairy";
  return "/login";
}

function handleAuthFailureOnce() {
  if (authFailureHandled) return;
  authFailureHandled = true;
  const loginPath = resolveLoginPath();
  clearAuthSession();
  if (window.location.pathname !== loginPath) {
    window.location.replace(loginPath);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const { skipAuthRedirect = false, ...fetchOptions } = options;
  const token = getToken();
  const maxRetries = 3;
  const retryDelay = 1000;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(fetchOptions.headers || {}),
        },
        ...fetchOptions,
      });

      let payload = null;
      try {
        payload = await res.json();
      } catch (_) {
        // ignore parse errors
      }

      if (!res.ok) {
        if ((res.status === 401 || res.status === 403) && !skipAuthRedirect) {
          handleAuthFailureOnce();
          throw new Error("Session expired or access denied. Please login again.");
        }

        let message = payload?.message || `Request failed (${res.status})`;
        
        // Add validation details if present
        if (payload?.issues && Array.isArray(payload.issues)) {
          const details = payload.issues.map(issue => 
            `${issue.path.join('.')}: ${issue.message}`
          ).join('; ');
          message += ` - ${details}`;
        }
        
        throw new Error(message);
      }

      return payload;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isNetworkError = error.message.includes('fetch') || error.name === 'TypeError';
      
      if (isNetworkError && !isLastAttempt) {
        console.warn(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`);
        await sleep(retryDelay * (attempt + 1));
        continue;
      }

      if (isNetworkError) {
        throw new Error(backendUnavailableMessage());
      }
      
      throw error;
    }
  }
}

export function fetchSocieties() {
  return request("/societies");
}

export function getMilkEntries(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  if (params.date) search.set("date", params.date);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.session) search.set("session", params.session);
  const qs = search.toString();
  return request(`/milk-entries${qs ? `?${qs}` : ""}`);
}

export function fetchRateAndAmount(body) {
  return request("/rates/calc", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createMilkEntries(body) {
  return request("/milk-entries", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createVerification(body) {
  return request("/verifications", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getSocietyDashboard(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const qs = search.toString();
  return request(`/dashboards/society${qs ? `?${qs}` : ""}`);
}

export function getBmcDashboard(params = {}) {
  const search = new URLSearchParams();
  if (params.bmcId) search.set("bmcId", params.bmcId);
  const qs = search.toString();
  return request(`/dashboards/bmc${qs ? `?${qs}` : ""}`);
}

export function getAdminDashboard() {
  return request("/dashboards/admin");
}

export function login(body) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    skipAuthRedirect: true,
  });
}

export function listRequests(params = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  const qs = search.toString();
  return request(`/requests${qs ? `?${qs}` : ""}`);
}

export function updateRequest(id, body) {
  return request(`/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function createRequest(body) {
  return request("/requests", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listNotifications(params = {}) {
  const search = new URLSearchParams();
  if (params.role) search.set("role", params.role);
  const qs = search.toString();
  return request(`/notifications${qs ? `?${qs}` : ""}`);
}

export async function listNotificationsForRole(role) {
  if (!role || role === "All") {
    return listNotifications({ role: "All" });
  }

  const [roleRes, allRes] = await Promise.all([
    listNotifications({ role }),
    listNotifications({ role: "All" }),
  ]);

  const mergedMap = new Map();
  for (const item of [...(roleRes?.data || []), ...(allRes?.data || [])]) {
    mergedMap.set(item._id, item);
  }

  const merged = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { data: merged };
}

export function createNotification(body) {
  return request("/notifications", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function markNotificationAsRead(notificationId) {
  return request(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export function archiveNotification(notificationId) {
  return request(`/notifications/${notificationId}`, {
    method: "DELETE",
  });
}

export async function uploadNotificationFile(file) {
  const token = localStorage.getItem("auth_token") || "";
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch(`${API_BASE}/uploads/notification`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.message || "Upload failed");
    return payload;
  } catch (error) {
    const isNetworkError = error?.message?.includes("fetch") || error?.name === "TypeError";
    if (isNetworkError) {
      throw new Error(backendUnavailableMessage());
    }
    throw error;
  }
}

export function listUsers() {
  return request("/admin/users");
}

export function createUser(body) {
  return request("/admin/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateUserAuth(id, body) {
  return request(`/admin/users/${id}/auth`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function getReportMilkProcured(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  const qs = search.toString();
  return request(`/reports/milk-procured${qs ? `?${qs}` : ""}`);
}

export function getReportMilkRejected(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  if (params.bmcId) search.set("bmcId", params.bmcId);
  const qs = search.toString();
  return request(`/reports/milk-rejected${qs ? `?${qs}` : ""}`);
}

export function getReportOverheads(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  if (params.bmcId) search.set("bmcId", params.bmcId);
  const qs = search.toString();
  return request(`/reports/overheads${qs ? `?${qs}` : ""}`);
}

export function getReportQuality(params = {}) {
  const search = new URLSearchParams();
  if (params.societyId) search.set("societyId", params.societyId);
  const qs = search.toString();
  return request(`/reports/quality${qs ? `?${qs}` : ""}`);
}

export function listTankerVerifications(params = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  const qs = search.toString();
  return request(`/tanker-verifications${qs ? `?${qs}` : ""}`);
}

export function getTankerVerification(id) {
  return request(`/tanker-verifications/${id}`);
}

export function updateTankerVerification(id, body) {
  return request(`/tanker-verifications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function getRouteNavigationOptions() {
  return request("/admin/route-navigation/options");
}

export function listTransports() {
  return request("/admin/transports");
}

export function createTransport(body) {
  return request("/admin/transports", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listTankers() {
  return request("/admin/tankers");
}

export function createTanker(body) {
  return request("/admin/tankers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listRoutePlans(params = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.transportId) search.set("transportId", params.transportId);
  if (params.tankerId) search.set("tankerId", params.tankerId);
  if (params.bmcId) search.set("bmcId", params.bmcId);
  const qs = search.toString();
  return request(`/admin/routes${qs ? `?${qs}` : ""}`);
}

export function createRoutePlan(body) {
  return request("/admin/routes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
