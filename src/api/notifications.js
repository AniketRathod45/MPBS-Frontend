// import { sharedMock } from "../mock/SharedMock";

export async function fetchNotifications() {
  await delay();
  return sharedMock.notifications;
}

export async function markNotificationRead(id) {
  const notif = sharedMock.notifications.find(n => n.id === id);
  if (notif) notif.read = true;
  return { success: true };
}

function delay(ms = 300) {
  return new Promise(res => setTimeout(res, ms));
}
