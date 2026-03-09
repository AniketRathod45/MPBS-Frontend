import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

export async function listUsers(req, res) {
  const users = await User.find({}, "username role authStatus createdAt").sort({ createdAt: -1 });
  res.json({ data: users });
}

export async function createUser(req, res) {
  const { username, password, role, profile } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash, role, profile });
  res.status(201).json({ data: user });
}

export async function updateUserAuth(req, res) {
  const { id } = req.params;
  const { authStatus } = req.body;
  const user = await User.findByIdAndUpdate(id, { authStatus }, { new: true });
  res.json({ data: user });
}
