// import { sharedMock } from "../mock/SharedMock";

export async function resetPassword({ username }) {
  await delay();

  sharedMock.requests.push({
    id: `req_${Date.now()}`,
    type: "forgot_password",
    username,
    status: "pending",
    requestedAt: new Date().toISOString(),
  });

  return {
    success: true,
    message: "Request sent to admin for approval",
  };
}

function delay(ms = 300) {
  return new Promise(res => setTimeout(res, ms));
}
