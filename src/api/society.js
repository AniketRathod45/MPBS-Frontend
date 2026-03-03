const DEFAULT_BASE_URL = "http://localhost:5000/api";

const getBaseUrl = () =>
  import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL;

const getToken = () => localStorage.getItem("society_token");

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return payload;
}

export function societyLogin({ username, password }) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getDashboardStats() {
  return request("/society/dashboard/stats");
}

export function getCattleFeed() {
  return request("/society/dashboard/cattle-feed");
}

export function getRevenue(year) {
  const qs = new URLSearchParams({ year: String(year) });
  return request(`/society/dashboard/revenue?${qs.toString()}`);
}

export function getCurrentSession() {
  return request("/society/milk-collection/current-session");
}

export function calculateMilkRate({ milkType, fat, snf }) {
  return request("/society/milk-collection/calculate-rate", {
    method: "POST",
    body: JSON.stringify({ milkType, fat, snf }),
  });
}

export function getMilkCollection(date, session) {
  return request(`/society/milk-collection/${date}/${session}`);
}

export function createMilkEntry(payload) {
  return request("/society/milk-collection", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteMilkEntry(id) {
  return request(`/society/milk-collection/${id}`, {
    method: "DELETE",
  });
}

export function getRateSheetGrouped() {
  return request("/society/rate-sheet/grouped");
}

export function calculateRateSheet({ milkType, fat, snf }) {
  return request("/society/rate-sheet/calculate", {
    method: "POST",
    body: JSON.stringify({ milkType, fat, snf }),
  });
}

export function getMilkCollectionReport(startDate, endDate) {
  const qs = new URLSearchParams({ startDate, endDate });
  return request(`/society/reports/milk-collection?${qs.toString()}`);
}

export function getRevenueReport(startDate, endDate) {
  const qs = new URLSearchParams({ startDate, endDate });
  return request(`/society/reports/revenue?${qs.toString()}`);
}

export function getCattleFeedReport(startDate, endDate) {
  const qs = new URLSearchParams({ startDate, endDate });
  return request(`/society/reports/cattle-feed?${qs.toString()}`);
}
