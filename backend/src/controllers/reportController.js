import { MilkEntry } from "../models/MilkEntry.js";
import { Verification } from "../models/Verification.js";
import { Overhead } from "../models/Overhead.js";

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

export async function milkProcuredReport(req, res) {
  const { societyId } = req.query;
  const months = lastMonths(3);
  const from = `${months[0].key}-01`;
  const to = new Date().toISOString().split("T")[0];

  const q = { date: { $gte: from, $lte: to } };
  if (societyId) q.societyId = societyId;

  const entries = await MilkEntry.find(q);
  const map = new Map();
  months.forEach((m) => map.set(m.label, { name: m.label, value: 0 }));

  entries.forEach((e) => {
    const label = monthLabel(new Date(e.date));
    const row = map.get(label);
    if (row) row.value += e.qty || 0;
  });

  res.json({ data: Array.from(map.values()) });
}

export async function milkRejectedReport(req, res) {
  const { societyId, bmcId } = req.query;
  const months = lastMonths(3);
  const from = `${months[0].key}-01`;
  const to = new Date().toISOString().split("T")[0];

  const q = { date: { $gte: from, $lte: to } };
  if (societyId) q.societyId = societyId;
  if (bmcId) q.bmcId = bmcId;

  const list = await Verification.find(q);
  const map = new Map();
  months.forEach((m) => map.set(m.label, { name: m.label, value: 0 }));

  list.forEach((v) => {
    if (v.verifyChoice !== "NO" || !Array.isArray(v.entries) || !Array.isArray(v.bmcEntries)) return;
    const label = monthLabel(new Date(v.date));
    const row = map.get(label);
    if (!row) return;
    let rejected = 0;
    v.entries.forEach((e, i) => {
      const b = v.bmcEntries[i];
      if (!b) return;
      const sQty = Number(e.qty || 0);
      const bQty = Number(b.qty || 0);
      rejected += Math.abs(sQty - bQty);
    });
    row.value += rejected;
  });

  res.json({ data: Array.from(map.values()) });
}

export async function overheadsReport(req, res) {
  const { societyId, bmcId } = req.query;
  const months = lastMonths(3);
  const q = {};
  if (societyId) q.societyId = societyId;
  if (bmcId) q.bmcId = bmcId;

  const rows = await Overhead.find(q);
  const map = new Map();
  months.forEach((m) => map.set(m.key, { name: m.label, diesel: 0, secretary: 0, repair: 0 }));

  rows.forEach((r) => {
    const key = r.month;
    const target = map.get(key);
    if (!target) return;
    target.diesel += r.diesel || 0;
    target.secretary += r.secretary || 0;
    target.repair += r.repair || 0;
  });

  res.json({ data: Array.from(map.values()) });
}

export async function qualityReport(req, res) {
  const { societyId } = req.query;
  const months = lastMonths(3);
  const from = `${months[0].key}-01`;
  const to = new Date().toISOString().split("T")[0];

  const q = { date: { $gte: from, $lte: to } };
  if (societyId) q.societyId = societyId;

  const entries = await MilkEntry.find(q);
  const map = new Map();
  months.forEach((m) => map.set(m.label, { name: m.label, good: 0, bad: 0 }));

  const standards = {
    Cow: { minFat: 3.5, maxFat: 6.0, minSnf: 8.0, maxSnf: 10.5 },
    Buffalo: { minFat: 6.0, maxFat: 9.0, minSnf: 9.0, maxSnf: 12.0 },
  };

  entries.forEach((e) => {
    const label = monthLabel(new Date(e.date));
    const row = map.get(label);
    if (!row) return;
    const std = standards[e.milkType];
    if (!std) return;
    const fat = Number(e.fat || 0);
    const snf = Number(e.snf || 0);
    const qty = Number(e.qty || 0);
    const ok = fat >= std.minFat && fat <= std.maxFat && snf >= std.minSnf && snf <= std.maxSnf;
    if (ok) row.good += qty;
    else row.bad += qty;
  });

  res.json({ data: Array.from(map.values()) });
}
