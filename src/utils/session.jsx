// utils/session.js
export function getSession() {
  const hour = new Date().getHours();
  return hour < 12 ? "M" : "E";
}
