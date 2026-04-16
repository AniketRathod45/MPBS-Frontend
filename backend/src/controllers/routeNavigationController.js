import { Society } from "../models/Society.js";
import { Transport } from "../models/Transport.js";
import { Tanker } from "../models/Tanker.js";
import { RoutePlan } from "../models/RoutePlan.js";
import { User } from "../models/User.js";

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value = "") {
  return String(value).trim();
}

function buildCaseInsensitiveExactRegex(value = "") {
  return new RegExp(`^${escapeRegex(normalizeText(value))}$`, "i");
}

function isValidObjectId(value = "") {
  return /^[a-fA-F0-9]{24}$/.test(String(value));
}

function invalidIdResponse(res, entity = "record") {
  return res.status(400).json({ message: `Invalid ${entity} ID` });
}

function searchRegex(value = "") {
  return new RegExp(escapeRegex(normalizeText(value)), "i");
}

function normalizeBmcId(value = "") {
  const trimmed = String(value || "").trim().toUpperCase();
  const match = trimmed.match(/^BMC[\s_-]?(\d+)$/i);
  if (match) {
    return `BMC_${String(Number(match[1])).padStart(3, "0")}`;
  }
  return trimmed;
}

function compareBmcIds(a = "", b = "") {
  const left = normalizeBmcId(a);
  const right = normalizeBmcId(b);

  const leftMatch = left.match(/^BMC_(\d+)$/);
  const rightMatch = right.match(/^BMC_(\d+)$/);

  if (leftMatch && rightMatch) {
    return Number(leftMatch[1]) - Number(rightMatch[1]);
  }

  return left.localeCompare(right);
}

export async function listRouteNavigationOptions(req, res) {
  const [transports, tankers, societyBmcs, bmcUsers] = await Promise.all([
    Transport.find({}).sort({ createdAt: -1 }),
    Tanker.find({}).sort({ createdAt: -1 }).populate("transportId"),
    Society.distinct("bmcId", { bmcId: { $exists: true, $ne: "" } }),
    User.find({ role: "BMC" }).select("username").lean(),
  ]);

  const bmcFromUsers = (bmcUsers || []).map((item) => String(item.username || "").trim()).filter(Boolean);
  const mergedBmcs = [...new Set([...(societyBmcs || []), ...bmcFromUsers].filter(Boolean).map(normalizeBmcId))].sort(compareBmcIds);

  return res.json({
    data: {
      transports,
      tankers,
      bmcs: mergedBmcs,
    },
  });
}

export async function createTransport(req, res) {
  const transportId = normalizeText(req.body.transportId);
  const name = normalizeText(req.body.name);
  const phone = normalizeText(req.body.phone);

  const exists = await Transport.findOne({ transportId: { $regex: buildCaseInsensitiveExactRegex(transportId) } });
  if (exists) {
    return res.status(409).json({ message: "Transport ID already exists" });
  }

  const created = await Transport.create({ transportId, name, phone });
  return res.status(201).json({ data: created });
}

export async function listTransports(req, res) {
  const { q = "" } = req.query;
  const query = {};

  if (normalizeText(q)) {
    const regex = searchRegex(q);
    query.$or = [{ transportId: regex }, { name: regex }, { phone: regex }];
  }

  const list = await Transport.find(query).sort({ createdAt: -1 });
  return res.json({ data: list });
}

export async function getTransport(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidIdResponse(res, "transport");

  const item = await Transport.findById(id);
  if (!item) {
    return res.status(404).json({ message: "Transport not found" });
  }

  return res.json({ data: item });
}

export async function createTanker(req, res) {
  const tankerId = normalizeText(req.body.tankerId);
  const plateNo = normalizeText(req.body.plateNo);
  const capacityLiters = Number(req.body.capacityLiters);
  const transportId = req.body.transportId || null;

  const exists = await Tanker.findOne({ tankerId: { $regex: buildCaseInsensitiveExactRegex(tankerId) } });
  if (exists) {
    return res.status(409).json({ message: "Tanker ID already exists" });
  }

  if (transportId && !isValidObjectId(transportId)) {
    return res.status(400).json({ message: "Invalid transport ID" });
  }

  if (transportId) {
    const transport = await Transport.findById(transportId);
    if (!transport) {
      return res.status(404).json({ message: "Transport not found" });
    }
  }

  const payload = {
    tankerId,
    plateNo,
    capacityLiters,
    transportId,
  };

  const created = await Tanker.create(payload);
  const hydrated = await Tanker.findById(created._id).populate("transportId");
  return res.status(201).json({ data: hydrated });
}

export async function listTankers(req, res) {
  const { q = "", transportId = "" } = req.query;
  const query = {};

  if (transportId) {
    if (!isValidObjectId(transportId)) return invalidIdResponse(res, "transport");
    query.transportId = transportId;
  }

  if (normalizeText(q)) {
    const regex = searchRegex(q);
    query.$or = [{ tankerId: regex }, { plateNo: regex }];
  }

  const list = await Tanker.find(query).sort({ createdAt: -1 }).populate("transportId");
  return res.json({ data: list });
}

export async function getTanker(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidIdResponse(res, "tanker");

  const item = await Tanker.findById(id).populate("transportId");
  if (!item) {
    return res.status(404).json({ message: "Tanker not found" });
  }

  return res.json({ data: item });
}

export async function createRoutePlan(req, res) {
  const routeCode = normalizeText(req.body.routeCode);
  const routeName = normalizeText(req.body.routeName);
  const transportId = req.body.transportId || null;
  const tankerId = req.body.tankerId || null;
  const bmcIds = Array.isArray(req.body.bmcIds)
    ? [...new Set(req.body.bmcIds.map((item) => normalizeBmcId(item)).filter(Boolean))]
    : [];

  const exists = await RoutePlan.findOne({ routeCode: { $regex: buildCaseInsensitiveExactRegex(routeCode) } });
  if (exists) {
    return res.status(409).json({ message: "Route code already exists" });
  }

  if (transportId && !isValidObjectId(transportId)) {
    return res.status(400).json({ message: "Invalid transport ID" });
  }
  if (tankerId && !isValidObjectId(tankerId)) {
    return res.status(400).json({ message: "Invalid tanker ID" });
  }

  const [transport, tanker] = await Promise.all([
    transportId ? Transport.findById(transportId) : Promise.resolve(null),
    tankerId ? Tanker.findById(tankerId) : Promise.resolve(null),
  ]);

  if (transportId && !transport) {
    return res.status(404).json({ message: "Transport not found" });
  }
  if (tankerId && !tanker) {
    return res.status(404).json({ message: "Tanker not found" });
  }
  if (tankerId && transportId && tanker?.transportId && String(tanker.transportId) !== String(transportId)) {
    return res.status(400).json({ message: "Selected tanker does not belong to selected transport" });
  }
  if (!bmcIds.length) {
    return res.status(400).json({ message: "At least one BMC is required" });
  }

  const payload = {
    routeCode,
    routeName,
    transportId,
    tankerId,
    bmcIds,
  };

  const created = await RoutePlan.create(payload);
  const hydrated = await RoutePlan.findById(created._id).populate("transportId").populate("tankerId");
  return res.status(201).json({ data: hydrated });
}

export async function listRoutePlans(req, res) {
  const { q = "", transportId = "", tankerId = "", bmcId = "" } = req.query;
  const query = {};

  if (transportId) {
    if (!isValidObjectId(transportId)) return invalidIdResponse(res, "transport");
    query.transportId = transportId;
  }

  if (tankerId) {
    if (!isValidObjectId(tankerId)) return invalidIdResponse(res, "tanker");
    query.tankerId = tankerId;
  }

  if (bmcId) {
    query.bmcIds = normalizeBmcId(bmcId);
  }

  if (normalizeText(q)) {
    const regex = searchRegex(q);
    query.$or = [{ routeCode: regex }, { routeName: regex }, { bmcIds: regex }];
  }

  const list = await RoutePlan.find(query)
    .sort({ createdAt: -1 })
    .populate("transportId")
    .populate("tankerId");
  return res.json({ data: list });
}

export async function getRoutePlan(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidIdResponse(res, "route");

  const item = await RoutePlan.findById(id).populate("transportId").populate("tankerId");
  if (!item) {
    return res.status(404).json({ message: "Route not found" });
  }

  return res.json({ data: item });
}

export async function updateTransport(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidIdResponse(res, "transport");
  const nextTransportId = req.body.transportId ? normalizeText(req.body.transportId) : undefined;
  const nextName = req.body.name ? normalizeText(req.body.name) : undefined;
  const nextPhone = req.body.phone ? normalizeText(req.body.phone) : undefined;

  if (nextTransportId) {
    const duplicate = await Transport.findOne({
      _id: { $ne: id },
      transportId: { $regex: buildCaseInsensitiveExactRegex(nextTransportId) },
    });
    if (duplicate) {
      return res.status(409).json({ message: "Transport ID already exists" });
    }
  }

  const updates = {};
  if (nextTransportId !== undefined) updates.transportId = nextTransportId;
  if (nextName !== undefined) updates.name = nextName;
  if (nextPhone !== undefined) updates.phone = nextPhone;

  const updated = await Transport.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!updated) {
    return res.status(404).json({ message: "Transport not found" });
  }

  return res.json({ data: updated });
}

export async function deleteTransport(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidIdResponse(res, "transport");

  const [tankerUsage, routeUsage] = await Promise.all([
    Tanker.countDocuments({ transportId: id }),
    RoutePlan.countDocuments({ transportId: id }),
  ]);

  if (tankerUsage > 0 || routeUsage > 0) {
    return res.status(409).json({
      message: "Transport is in use by tanker/route records and cannot be deleted",
    });
  }

  const deleted = await Transport.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(404).json({ message: "Transport not found" });
  }

  return res.json({ data: deleted });
}

export async function updateTanker(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidIdResponse(res, "tanker");
  const nextTankerId = req.body.tankerId ? normalizeText(req.body.tankerId) : undefined;
  const nextPlateNo = req.body.plateNo !== undefined ? normalizeText(req.body.plateNo) : undefined;
  const nextCapacity = req.body.capacityLiters !== undefined ? Number(req.body.capacityLiters) : undefined;
  const nextTransportId = req.body.transportId !== undefined ? req.body.transportId || null : undefined;

  if (nextTankerId) {
    const duplicate = await Tanker.findOne({
      _id: { $ne: id },
      tankerId: { $regex: buildCaseInsensitiveExactRegex(nextTankerId) },
    });
    if (duplicate) {
      return res.status(409).json({ message: "Tanker ID already exists" });
    }
  }

  if (nextTransportId && !isValidObjectId(nextTransportId)) {
    return res.status(400).json({ message: "Invalid transport ID" });
  }

  if (nextTransportId) {
    const transport = await Transport.findById(nextTransportId);
    if (!transport) {
      return res.status(404).json({ message: "Transport not found" });
    }
  }

  const updates = {};
  if (nextTankerId !== undefined) updates.tankerId = nextTankerId;
  if (nextPlateNo !== undefined) updates.plateNo = nextPlateNo;
  if (nextCapacity !== undefined) updates.capacityLiters = nextCapacity;
  if (nextTransportId !== undefined) updates.transportId = nextTransportId;

  const updated = await Tanker.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate("transportId");
  if (!updated) {
    return res.status(404).json({ message: "Tanker not found" });
  }

  return res.json({ data: updated });
}

export async function deleteTanker(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidIdResponse(res, "tanker");
  const routeUsage = await RoutePlan.countDocuments({ tankerId: id });

  if (routeUsage > 0) {
    return res.status(409).json({ message: "Tanker is assigned to one or more routes and cannot be deleted" });
  }

  const deleted = await Tanker.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(404).json({ message: "Tanker not found" });
  }

  return res.json({ data: deleted });
}

export async function updateRoutePlan(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidIdResponse(res, "route");
  const nextRouteCode = req.body.routeCode ? normalizeText(req.body.routeCode) : undefined;
  const nextRouteName = req.body.routeName ? normalizeText(req.body.routeName) : undefined;
  const nextTransportId = req.body.transportId !== undefined ? req.body.transportId : undefined;
  const nextTankerId = req.body.tankerId !== undefined ? req.body.tankerId || null : undefined;
  const nextBmcIds = Array.isArray(req.body.bmcIds)
    ? [...new Set(req.body.bmcIds.map((item) => normalizeBmcId(item)).filter(Boolean))]
    : undefined;

  if (nextRouteCode) {
    const duplicate = await RoutePlan.findOne({
      _id: { $ne: id },
      routeCode: { $regex: buildCaseInsensitiveExactRegex(nextRouteCode) },
    });
    if (duplicate) {
      return res.status(409).json({ message: "Route code already exists" });
    }
  }

  if (nextTransportId !== undefined && nextTransportId && !isValidObjectId(nextTransportId)) {
    return res.status(400).json({ message: "Invalid transport ID" });
  }
  if (nextTankerId !== undefined && nextTankerId && !isValidObjectId(nextTankerId)) {
    return res.status(400).json({ message: "Invalid tanker ID" });
  }

  if (nextTransportId) {
    const transport = await Transport.findById(nextTransportId);
    if (!transport) {
      return res.status(404).json({ message: "Transport not found" });
    }
  }
  let tanker = null;
  if (nextTankerId) {
    tanker = await Tanker.findById(nextTankerId);
    if (!tanker) {
      return res.status(404).json({ message: "Tanker not found" });
    }
  }

  if (nextBmcIds !== undefined && !nextBmcIds.length) {
    return res.status(400).json({ message: "At least one BMC is required" });
  }

  const existing = await RoutePlan.findById(id).select("transportId");
  if (!existing) {
    return res.status(404).json({ message: "Route not found" });
  }

  const resolvedTransportId = nextTransportId !== undefined ? nextTransportId : String(existing.transportId || "");
  if (nextTankerId && tanker?.transportId && String(tanker.transportId) !== String(resolvedTransportId)) {
    return res.status(400).json({ message: "Selected tanker does not belong to selected transport" });
  }

  const updates = {};
  if (nextRouteCode !== undefined) updates.routeCode = nextRouteCode;
  if (nextRouteName !== undefined) updates.routeName = nextRouteName;
  if (nextTransportId !== undefined) updates.transportId = nextTransportId;
  if (nextTankerId !== undefined) updates.tankerId = nextTankerId;
  if (nextBmcIds !== undefined) updates.bmcIds = nextBmcIds;

  const updated = await RoutePlan.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate("transportId")
    .populate("tankerId");

  if (!updated) {
    return res.status(404).json({ message: "Route not found" });
  }

  return res.json({ data: updated });
}

export async function deleteRoutePlan(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) return invalidIdResponse(res, "route");
  const deleted = await RoutePlan.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(404).json({ message: "Route not found" });
  }

  return res.json({ data: deleted });
}
