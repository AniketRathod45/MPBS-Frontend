import {
  getUsers,
  addUser,
  updateUserAuth,
  getRequests,
  updateRequestStatus,
  addNotification
} from "../mock/adminData";

// Auth
export async function adminLogin({ username, password }) {
  await new Promise(res => setTimeout(res, 300));

  // Mock validation
  if (username === "admin" && password === "admin123") {
    return {
      success: true,
      token: "mock_admin_token",
      admin: { username: "admin", role: "Admin" }
    };
  }

  return { success: false, message: "Invalid credentials" };
}

// User Management
export async function fetchUsers() {
  await new Promise(res => setTimeout(res, 300));
  return getUsers();
}

export async function createUser(userData) {
  await new Promise(res => setTimeout(res, 400));
  
  // Validation
  if (!userData.username || !userData.role) {
    return { success: false, message: "Username and role required" };
  }

  addUser(userData);
  return { success: true };
}

export async function updateUserAuthStatus(userId, status) {
  await new Promise(res => setTimeout(res, 300));
  updateUserAuth(userId, status);
  return { success: true };
}

// Requests
export async function fetchRequests() {
  await new Promise(res => setTimeout(res, 300));
  return getRequests();
}

export async function approveRequest(reqId) {
  await new Promise(res => setTimeout(res, 300));
  
  const req = getRequests().find(r => r.id === reqId);
  if (req) {
    updateRequestStatus(reqId, "approved");
    if (req.type === "account_approval") {
      updateUserAuth(req.userId, "Approved");
    }
  }
  
  return { success: true };
}

export async function rejectRequest(reqId) {
  await new Promise(res => setTimeout(res, 300));
  updateRequestStatus(reqId, "rejected");
  return { success: true };
}

// Notifications
export async function sendNotification({ sentTo, message, attachment }) {
  await new Promise(res => setTimeout(res, 400));
  
  if (!sentTo || !message) {
    return { success: false, message: "Recipient and message required" };
  }

  addNotification({ sentTo, message, attachment });
  return { success: true };
}