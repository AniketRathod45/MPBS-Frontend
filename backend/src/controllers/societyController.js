import { Society } from "../models/Society.js";

export async function listSocieties(req, res) {
  const query = {};
  
  // If logged-in user is BMC, filter societies by their BMC ID
  if (req.user && req.user.role === "BMC") {
    const bmcId = req.user.username;
    query.bmcId = bmcId;
  }
  
  const list = await Society.find(query, "societyId societyName district taluk contactNumber bmcId").sort({ societyName: 1 });
  res.json({ data: list });
}
