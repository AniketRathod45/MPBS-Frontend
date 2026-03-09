import { Notification } from "../models/Notification.js";

export async function listNotifications(req, res) {
  const { role } = req.query;
  const q = role ? { sentToRole: role } : {};
  const list = await Notification.find(q).sort({ createdAt: -1 });
  res.json({ data: list });
}

export async function createNotification(req, res) {
  const record = await Notification.create(req.body);
  res.status(201).json({ data: record });
}
