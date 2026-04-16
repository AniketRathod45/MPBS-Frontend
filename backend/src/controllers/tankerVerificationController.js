import { TankerVerification } from "../models/TankerVerification.js";
import { RoutePlan } from "../models/RoutePlan.js";
import { Society } from "../models/Society.js";

function serializeShipment(doc) {
  const obj = doc.toObject();
  return {
    ...obj,
    id: String(obj._id),
  };
}

function isValidObjectId(value = "") {
  return /^[a-fA-F0-9]{24}$/.test(String(value));
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value = "") {
  return String(value || "").trim();
}

function normalizeBmcId(value = "") {
  const trimmed = String(value || "").trim().toUpperCase();
  const match = trimmed.match(/^BMC[\s_-]?(\d+)$/i);
  if (match) {
    return `BMC_${String(Number(match[1])).padStart(3, "0")}`;
  }
  return trimmed;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStops(stops = []) {
  return (stops || []).map((item) => ({
    bmc: normalizeBmcId(item.bmc),
    societies: toNumber(item.societies, 0),
    milkType: normalizeText(item.milkType),
    expected: toNumber(item.expected, 0),
    received: toNumber(item.received, 0),
  }));
}

function normalizeQualityRows(quality = []) {
  return (quality || []).map((item) => ({
    parameter: normalizeText(item.parameter),
    routeSheet: String(item.routeSheet ?? "").trim(),
    dairyTest: String(item.dairyTest ?? "").trim(),
  }));
}

function normalizeReportedIssue(reportedIssue) {
  if (reportedIssue === null) return null;
  if (!reportedIssue || typeof reportedIssue !== "object") return undefined;

  const reportMilkSummary = reportedIssue.reportMilkSummary || {};
  const reportQuality = reportedIssue.reportQuality || {};
  const issueComparisonGroups = Array.isArray(reportedIssue.issueComparisonGroups)
    ? reportedIssue.issueComparisonGroups.map((group) => ({
        type: normalizeText(group?.type),
        received: {
          fat: String(group?.received?.fat ?? "0"),
          snf: String(group?.received?.snf ?? "0"),
          qty: String(group?.received?.qty ?? "0"),
        },
        added: {
          fat: String(group?.added?.fat ?? "0"),
          snf: String(group?.added?.snf ?? "0"),
          qty: String(group?.added?.qty ?? "0"),
        },
      }))
    : [];

  return {
    reportMilkSummary: {
      cowExpected: String(reportMilkSummary.cowExpected ?? "0"),
      cowReceived: String(reportMilkSummary.cowReceived ?? "0"),
      buffaloExpected: String(reportMilkSummary.buffaloExpected ?? "0"),
      buffaloReceived: String(reportMilkSummary.buffaloReceived ?? "0"),
    },
    reportQuality: {
      cowFat: String(reportQuality.cowFat ?? "0"),
      cowSmp: String(reportQuality.cowSmp ?? "0"),
      buffaloFat: String(reportQuality.buffaloFat ?? "0"),
      buffaloSmp: String(reportQuality.buffaloSmp ?? "0"),
    },
    issueComparisonGroups,
  };
}

async function syncActiveTripsFromRouteNavigation() {
  const [routePlans, societyCounts] = await Promise.all([
    RoutePlan.find({}).populate("tankerId").populate("transportId").lean(),
    Society.aggregate([
      { $match: { bmcId: { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: "$bmcId",
          societies: { $sum: 1 },
        },
      },
    ]),
  ]);

  const societiesByBmc = new Map();
  for (const row of societyCounts || []) {
    societiesByBmc.set(normalizeBmcId(row._id), Number(row.societies) || 0);
  }

  for (const plan of routePlans || []) {
    const bmcIds = Array.isArray(plan.bmcIds) ? plan.bmcIds.map((bmc) => normalizeBmcId(bmc)).filter(Boolean) : [];
    const defaultStops = bmcIds.map((bmc) => ({
      bmc,
      societies: societiesByBmc.get(bmc) || 0,
      milkType: "Mixed",
      expected: 0,
      received: 0,
    }));

    const existing = await TankerVerification.findOne({ routePlanId: plan._id }).lean();

    if (!existing) {
      await TankerVerification.create({
        routePlanId: plan._id,
        tankerId: plan.tankerId?.tankerId || `UNASSIGNED-${plan.routeCode}`,
        route: plan.routeCode,
        arrivalTime: "-",
        transporter: plan.transportId?.name || "-",
        status: "pending",
        stops: defaultStops,
        quality: [
          { parameter: "Fat", routeSheet: "-", dairyTest: "-" },
          { parameter: "SNF", routeSheet: "-", dairyTest: "-" },
          { parameter: "Temperature", routeSheet: "-", dairyTest: "-" },
        ],
        reportedIssue: null,
        updatedBy: "route-sync",
      });
      continue;
    }

    if (existing.status === "pending") {
      await TankerVerification.findByIdAndUpdate(existing._id, {
        tankerId: plan.tankerId?.tankerId || `UNASSIGNED-${plan.routeCode}`,
        route: plan.routeCode,
        transporter: plan.transportId?.name || "-",
        stops: defaultStops,
        updatedBy: existing.updatedBy || "route-sync",
      });
    }
  }

  const activeRoutePlanIds = (routePlans || []).map((plan) => plan._id);
  await TankerVerification.deleteMany({
    routePlanId: { $exists: true, $ne: null, $nin: activeRoutePlanIds },
  });
}

export async function listTankerVerifications(req, res) {
  await syncActiveTripsFromRouteNavigation();

  const {
    q = "",
    status = "",
    tankerId = "",
    route = "",
    bmc = "",
    updatedBy = "",
    from = "",
    to = "",
  } = req.query;
  const query = {
    routePlanId: { $exists: true, $ne: null },
  };

  if (status) {
    query.status = status;
  }

  if (normalizeText(tankerId)) {
    query.tankerId = { $regex: new RegExp(`^${escapeRegex(normalizeText(tankerId))}$`, "i") };
  }

  if (normalizeText(route)) {
    query.route = { $regex: new RegExp(`^${escapeRegex(normalizeText(route))}$`, "i") };
  }

  if (normalizeText(bmc)) {
    query["stops.bmc"] = { $regex: new RegExp(`^${escapeRegex(normalizeBmcId(bmc))}$`, "i") };
  }

  if (normalizeText(updatedBy)) {
    query.updatedBy = { $regex: new RegExp(`^${escapeRegex(normalizeText(updatedBy))}$`, "i") };
  }

  if (from || to) {
    query.updatedAt = {};
    if (from) query.updatedAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query.updatedAt.$lte = end;
    }
  }

  if (q) {
    const safe = normalizeText(q);
    query.$or = [
      { tankerId: { $regex: safe, $options: "i" } },
      { "stops.bmc": { $regex: safe, $options: "i" } },
      { route: { $regex: safe, $options: "i" } },
      { updatedBy: { $regex: safe, $options: "i" } },
    ];
  }

  const rows = await TankerVerification.find(query).sort({ updatedAt: -1, createdAt: -1 });
  return res.json({ data: rows.map(serializeShipment) });
}

export async function getTankerVerification(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid tanker verification ID" });
  }

  const record = await TankerVerification.findById(id);
  if (!record) {
    return res.status(404).json({ message: "Tanker verification not found" });
  }
  return res.json({ data: serializeShipment(record) });
}

export async function createTankerVerification(req, res) {
  const payload = {
    tankerId: normalizeText(req.body.tankerId),
    route: normalizeText(req.body.route),
    arrivalTime: normalizeText(req.body.arrivalTime) || "-",
    transporter: normalizeText(req.body.transporter) || "-",
    status: req.body.status || "pending",
    stops: normalizeStops(req.body.stops || []),
    quality: normalizeQualityRows(req.body.quality || []),
    reportedIssue: normalizeReportedIssue(req.body.reportedIssue ?? null),
    updatedBy: req.user?.username || req.user?.sub || "system",
  };

  const created = await TankerVerification.create(payload);
  return res.status(201).json({ data: serializeShipment(created) });
}

export async function updateTankerVerification(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid tanker verification ID" });
  }

  const updates = {
    updatedBy: req.user?.username || req.user?.sub || "system",
  };

  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.tankerId !== undefined) updates.tankerId = normalizeText(req.body.tankerId);
  if (req.body.route !== undefined) updates.route = normalizeText(req.body.route);
  if (req.body.arrivalTime !== undefined) updates.arrivalTime = normalizeText(req.body.arrivalTime) || "-";
  if (req.body.transporter !== undefined) updates.transporter = normalizeText(req.body.transporter) || "-";
  if (req.body.stops !== undefined) updates.stops = normalizeStops(req.body.stops);
  if (req.body.quality !== undefined) updates.quality = normalizeQualityRows(req.body.quality);
  if (req.body.reportedIssue !== undefined) {
    updates.reportedIssue = normalizeReportedIssue(req.body.reportedIssue);
  }

  const hasAnyBusinessField = Object.keys(updates).some((key) => key !== "updatedBy");
  if (!hasAnyBusinessField) {
    return res.status(400).json({ message: "No valid fields provided for update" });
  }

  const payload = {
    ...updates,
  };

  const updated = await TankerVerification.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!updated) {
    return res.status(404).json({ message: "Tanker verification not found" });
  }

  return res.json({ data: serializeShipment(updated) });
}

export async function deleteTankerVerification(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid tanker verification ID" });
  }

  const deleted = await TankerVerification.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(404).json({ message: "Tanker verification not found" });
  }

  return res.json({ data: serializeShipment(deleted) });
}
