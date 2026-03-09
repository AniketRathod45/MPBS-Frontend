import { MilkEntry } from "../models/MilkEntry.js";
import { Society } from "../models/Society.js";
import { Verification } from "../models/Verification.js";

function toDateStr(d = new Date()) {
  return d.toISOString().split("T")[0];
}

function monthLabel(d) {
  return d.toLocaleString("en-US", { month: "short" });
}

function lastMonths(count = 3) {
  const out = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: monthLabel(d) });
  }
  return out;
}

function monthBucketsBetween(fromDate, toDate) {
  const out = [];
  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return out;
  }

  let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);

  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    out.push({ key, label: `${monthLabel(cursor)} ${cursor.getFullYear()}` });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return out;
}

function sumBy(list, pred) {
  return list.reduce((s, v) => s + (pred(v) || 0), 0);
}

export async function getSocietyDashboard(req, res) {
  const societyId = req.query.societyId || "";
  const fromDate = req.query.from || "";
  const toDate = req.query.to || "";
  const today = toDateStr();
  const hasRange = Boolean(fromDate && toDate);
  const rangeFrom = hasRange ? fromDate : today;
  const rangeTo = hasRange ? toDate : today;

  const entries = await MilkEntry.find({ societyId, date: { $gte: rangeFrom, $lte: rangeTo } });
  const totalMilk = sumBy(entries, (e) => e.qty);
  const morning = sumBy(entries, (e) => (e.session === "M" ? e.qty : 0));
  const evening = sumBy(entries, (e) => (e.session === "E" ? e.qty : 0));
  const cow = sumBy(entries, (e) => (e.milkType === "Cow" ? e.qty : 0));
  const buffalo = sumBy(entries, (e) => (e.milkType === "Buffalo" ? e.qty : 0));

  const society = await Society.findOne({ societyId });
  const memberCounts = society?.memberCounts || {};
  const farmerCounts = society?.farmerCounts || {};
  const totalFarmers =
    Object.values(memberCounts).reduce((s, v) => s + (Number(v) || 0), 0) ||
    Object.values(farmerCounts).reduce((s, v) => s + (Number(v) || 0), 0) ||
    0;

  const months = hasRange ? monthBucketsBetween(fromDate, toDate) : lastMonths(3);
  const revenueFrom = hasRange ? fromDate : `${months[0].key}-01`;
  const revenueTo = hasRange ? toDate : toDateStr();
  const rangeEntries = await MilkEntry.find({ societyId, date: { $gte: revenueFrom, $lte: revenueTo } });

  const revenueMap = new Map();
  months.forEach((m) => revenueMap.set(m.label, { month: m.label, buffalo: 0, cow: 0 }));

  rangeEntries.forEach((e) => {
    const d = new Date(e.date);
    const label = monthLabel(d);
    const bucket = revenueMap.get(label);
    if (!bucket) return;
    if (e.milkType === "Buffalo") bucket.buffalo += e.amount || 0;
    if (e.milkType === "Cow") bucket.cow += e.amount || 0;
  });

  const summary = {
    totalMilk: Number(totalMilk.toFixed(2)),
    totalFarmers,
    session: { morning: Number(morning.toFixed(2)), evening: Number(evening.toFixed(2)) },
    type: { cow: Number(cow.toFixed(2)), buffalo: Number(buffalo.toFixed(2)) },
  };

  const milkBreakdown = [
    { name: "Cow Milk", value: summary.type.cow },
    { name: "Buffalo Milk", value: summary.type.buffalo },
  ];

  const feedMineral = society?.feedMineral || [
    { name: "Cattle Feed", qty: "0 Kg", lastReceived: "-" },
    { name: "Mineral Mix", qty: "0 Kg", lastReceived: "-" },
  ];

  res.json({
    data: {
      summary,
      milkBreakdown,
      revenue: Array.from(revenueMap.values()),
      feedMineral,
    },
  });
}

export async function getBmcDashboard(req, res) {
  const bmcId = req.query.bmcId || "";
  const today = toDateStr();

  const societyQuery = bmcId ? { bmcId } : {};
  const societies = await Society.find(societyQuery, "societyId societyName bmcId");
  const societyIds = societies.map((s) => s.societyId);

  const entries = await MilkEntry.find({ date: today, societyId: { $in: societyIds } });
  const totalMilk = sumBy(entries, (e) => e.qty);
  const cow = sumBy(entries, (e) => (e.milkType === "Cow" ? e.qty : 0));
  const buffalo = sumBy(entries, (e) => (e.milkType === "Buffalo" ? e.qty : 0));

  const verifications = await Verification.find({ date: today, societyId: { $in: societyIds } });
  const verifiedSet = new Set(verifications.map((v) => v.societyId));
  const verifiedQty = sumBy(entries, (e) => (verifiedSet.has(e.societyId) ? e.qty : 0));

  const summary = {
    totalMilk: Number(totalMilk.toFixed(2)),
    totalVerified: Number(verifiedQty.toFixed(2)),
    type: { cow: Number(cow.toFixed(2)), buffalo: Number(buffalo.toFixed(2)) },
  };

  const milkBreakdown = [
    { name: "Cow Milk", value: summary.type.cow },
    { name: "Buffalo Milk", value: summary.type.buffalo },
  ];

  const months = lastMonths(3);
  const from = `${months[0].key}-01`;
  const to = toDateStr();
  const rangeEntries = await MilkEntry.find({ date: { $gte: from, $lte: to }, societyId: { $in: societyIds } });

  const societyNameMap = new Map(societies.map((s) => [s.societyId, s.societyName || s.societyId]));

  const procuredByMonth = {};
  const rejectedByMonth = {};
  months.forEach((m) => {
    procuredByMonth[m.label] = [];
    rejectedByMonth[m.label] = [];
  });

  const monthSocietyTotals = new Map();
  rangeEntries.forEach((e) => {
    const d = new Date(e.date);
    const label = monthLabel(d);
    if (!procuredByMonth[label]) return;
    const key = `${label}::${e.societyId}`;
    const prev = monthSocietyTotals.get(key) || 0;
    monthSocietyTotals.set(key, prev + (e.qty || 0));
  });

  monthSocietyTotals.forEach((qty, key) => {
    const [label, socId] = key.split("::");
    const name = societyNameMap.get(socId) || socId;
    procuredByMonth[label].push({ name, value: Number(qty.toFixed(2)) });
    rejectedByMonth[label].push({ name, value: 0 });
  });

  const dispatchStats = {
    totalDispatches: societies.length,
    pendingDispatches: Math.max(0, societies.length - verifiedSet.size),
  };

  res.json({
    data: {
      summary,
      milkBreakdown,
      milkProcuredByMonth: procuredByMonth,
      milkRejectedByMonth: rejectedByMonth,
      dispatchStats,
    },
  });
}
