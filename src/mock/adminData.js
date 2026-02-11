// Mock database for admin module
let mockUsers = [
  {
    id: "user_001",
    username: "SOCIETY_001",
    role: "Society",
    authStatus: "Approved",
    createdAt: "2025-12-20T10:30:00",
    data: {
      societyNo: "001",
      name: "Andhral Society",
      taluk: "Raichur",
      district: "Raichur",
      hobli: "Central",
      bankDetails: "SBI - 12345678",
      pan: "ABCDE1234F",
      commissionedDate: "2020-01-15",
      regDate: "2020-01-10",
      eoDetails: "EO_001",
      routeNo: "R-01",
      bmc: "BMC_001",
      contactNo: "9876543210",
      address: "Main Road, Raichur",
      electionTaluk: "Raichur",
      buildingType: "Own",
      openSite: "Yes",
      totalMembersSC: 50,
      totalMembersST: 30,
      totalMembersGeneral: 120
    }
  }
];

let mockRequests = [
  {
    id: "req_001",
    type: "forgot_password",
    userId: "user_001",
    username: "SOCIETY_001",
    role: "Society",
    status: "pending",
    requestedAt: "2025-12-23T09:15:00",
    message: "Forgot password, please reset"
  }
];

let mockNotifications = [];

// Getters
export const getUsers = () => mockUsers;
export const getRequests = () => mockRequests;
export const getNotifications = () => mockNotifications;

// Setters
export const addUser = (user) => {
  mockUsers.push({
    id: `user_${Date.now()}`,
    createdAt: new Date().toISOString(),
    authStatus: "Pending",
    ...user
  });
};

export const updateUserAuth = (userId, status) => {
  const user = mockUsers.find(u => u.id === userId);
  if (user) user.authStatus = status;
};

export const updateRequestStatus = (reqId, status) => {
  const req = mockRequests.find(r => r.id === reqId);
  if (req) req.status = status;
};

export const addNotification = (notification) => {
  mockNotifications.push({
    id: `notif_${Date.now()}`,
    sentAt: new Date().toISOString(),
    ...notification
  });
};