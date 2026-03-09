import { Verification } from "../models/Verification.js";

export async function createVerification(req, res) {
  const record = await Verification.create(req.body);
  res.status(201).json({ data: record });
}

export async function listVerifications(req, res) {
  const { societyId, date, session } = req.query;
  const q = {};
  if (societyId) q.societyId = societyId;
  if (date) q.date = date;
  if (session) q.session = session;

  const list = await Verification.find(q).sort({ createdAt: -1 });
  res.json({ data: list });
}
