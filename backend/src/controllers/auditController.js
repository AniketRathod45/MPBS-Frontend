import { MilkEntry } from "../models/MilkEntry.js";
import { Society } from "../models/Society.js";
import { User } from "../models/User.js";
import { Verification } from "../models/Verification.js";
import {
  BillingCycle,
  Claim,
  Payment,
  Recoverable,
  SocietyBilling,
} from "../models/accounts.js";

function toDateOnly(value) {
  if (!value) return "";
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function sum(list, iteratee) {
  return list.reduce((total, item) => total + Number(iteratee(item) || 0), 0);
}

function toMoney(value) {
  return Math.round(Number(value || 0));
}

function toCards(pairs) {
  return pairs.map((item) => ({
    label: item.label,
    value: item.value,
    sub: item.sub || "",
  }));
}

async function resolveBillingCycle(cycleId) {
  if (!cycleId) {
    return BillingCycle.findOne().sort({ createdAt: -1 });
  }

  const query = [{ code: String(cycleId) }];
  if (/^[a-f0-9]{24}$/i.test(String(cycleId))) {
    query.push({ _id: cycleId });
  }

  return BillingCycle.findOne({ $or: query });
}

function getDateRange(req) {
  const date = toDateOnly(req.query.date) || todayIso();
  const from = toDateOnly(req.query.from) || date;
  const to = toDateOnly(req.query.to) || date;
  return { date, from, to };
}

async function buildSocietyAudit(req) {
  const societyId = req.query.societyId || "";
  const { date, from, to } = getDateRange(req);
  const targetSociety = societyId ? await Society.findOne({ societyId }).lean() : await Society.findOne().sort({ createdAt: -1 }).lean();
  const selectedSocietyId = societyId || targetSociety?.societyId || "";

  const entries = await MilkEntry.find({ societyId: selectedSocietyId, date: { $gte: from, $lte: to } }).lean();
  const verifications = await Verification.find({ societyId: selectedSocietyId, date: { $gte: from, $lte: to } }).lean();
  const latestBilling = selectedSocietyId
    ? await SocietyBilling.findOne({ societyId: selectedSocietyId }).sort({ createdAt: -1 }).lean()
    : null;

  const totalMilk = sum(entries, (entry) => entry.qty);
  const totalFarmers =
    sum(Object.values(targetSociety?.memberCounts || {}), (value) => value) ||
    sum(Object.values(targetSociety?.farmerCounts || {}), (value) => value);
  const verifiedQty = sum(verifications.filter((row) => row.verifyChoice === "YES"), (row) =>
    sum(Array.isArray(row.entries) ? row.entries : [], (entry) => entry.qty)
  );
  const verificationStatus = totalMilk > 0 ? Math.round((verifiedQty / totalMilk) * 100) : 0;
  const cowQty = sum(entries.filter((entry) => entry.milkType === "Cow"), (entry) => entry.qty);
  const buffaloQty = sum(entries.filter((entry) => entry.milkType === "Buffalo"), (entry) => entry.qty);
  const morningQty = sum(entries.filter((entry) => entry.session === "M"), (entry) => entry.qty);
  const eveningQty = sum(entries.filter((entry) => entry.session === "E"), (entry) => entry.qty);

  return {
    role: "Society",
    label: targetSociety?.societyName || selectedSocietyId || "Society",
    date,
    filters: { societyId: selectedSocietyId, from, to },
    cards: toCards([
      { label: "Total Milk Collected", value: `${totalMilk.toLocaleString("en-IN")} L`, sub: `Society ${selectedSocietyId || "-"}` },
      { label: "Total Farmers", value: String(totalFarmers || 0), sub: "Active farmers" },
      { label: "Verification Status", value: `${verificationStatus}%`, sub: "Verified quantity" },
      { label: "Cow Milk", value: `${cowQty.toLocaleString("en-IN")} L`, sub: "Cow" },
      { label: "Buffalo Milk", value: `${buffaloQty.toLocaleString("en-IN")} L`, sub: "Buffalo" },
      { label: "Morning Collection", value: `${morningQty.toLocaleString("en-IN")} L`, sub: "Morning" },
      { label: "Evening Collection", value: `${eveningQty.toLocaleString("en-IN")} L`, sub: "Evening" },
      { label: "Milk Amount", value: `Rs ${toMoney(latestBilling?.milkAmount || 0).toLocaleString("en-IN")}`, sub: "Billing amount" },
    ]),
  };
}

async function buildBmcAudit(req) {
  const bmcId = req.query.bmcId || "";
  const { date, from, to } = getDateRange(req);
  const societyQuery = bmcId ? { bmcId } : {};
  const societies = await Society.find(societyQuery).lean();
  const societyIds = societies.map((society) => society.societyId);

  const entries = await MilkEntry.find({ societyId: { $in: societyIds }, date: { $gte: from, $lte: to } }).lean();
  const verifications = await Verification.find({ societyId: { $in: societyIds }, date: { $gte: from, $lte: to } }).lean();
  const verifiedSocietyIds = new Set(verifications.filter((row) => row.verifyChoice === "YES").map((row) => row.societyId));

  const totalMilk = sum(entries, (entry) => entry.qty);
  const verifiedQty = sum(entries.filter((entry) => verifiedSocietyIds.has(entry.societyId)), (entry) => entry.qty);
  const acceptanceRate = totalMilk > 0 ? Math.round((verifiedQty / totalMilk) * 100) : 0;
  const cowQty = sum(entries.filter((entry) => entry.milkType === "Cow"), (entry) => entry.qty);
  const buffaloQty = sum(entries.filter((entry) => entry.milkType === "Buffalo"), (entry) => entry.qty);
  const totalDispatches = entries.length;

  return {
    role: "BMC",
    label: bmcId || "All BMC",
    date,
    filters: { bmcId, from, to },
    cards: toCards([
      { label: "Total Milk Received", value: `${totalMilk.toLocaleString("en-IN")} L`, sub: "From societies" },
      { label: "Total Verified", value: `${verifiedQty.toLocaleString("en-IN")} L`, sub: "Quality approved" },
      { label: "Acceptance Rate", value: `${acceptanceRate}%`, sub: "Passed QC" },
      { label: "Cow Milk Received", value: `${cowQty.toLocaleString("en-IN")} L`, sub: "Type A" },
      { label: "Buffalo Milk Received", value: `${buffaloQty.toLocaleString("en-IN")} L`, sub: "Type B" },
      { label: "Total Dispatches", value: String(totalDispatches), sub: "Batches" },
    ]),
  };
}

async function buildAdminAudit(req) {
  const { date } = getDateRange(req);
  const approvedDairyUsers = await User.countDocuments({ role: "Dairy", authStatus: "Approved" });
  const approvedEoUsers = await User.countDocuments({ role: "EO", authStatus: "Approved" });
  const societies = await Society.find().lean();
  const bmcCount = new Set(societies.map((society) => society.bmcId).filter(Boolean)).size;

  return {
    role: "Admin",
    label: "admin001",
    date,
    cards: toCards([
      { label: "No. of DCS", value: String(societies.length), sub: "Societies" },
      { label: "No. of BMC", value: String(bmcCount), sub: "Operational" },
      { label: "No. of Dairy Units", value: String(approvedDairyUsers), sub: "Active" },
      { label: "No. of EO", value: String(approvedEoUsers), sub: "EO" },
    ]),
  };
}

async function buildAccountAudit(req) {
  const cycleId = req.query.cycleId || req.query.billingCycleId || "";
  const { date } = getDateRange(req);
  const cycle = await resolveBillingCycle(cycleId);
  const billingCycleId = cycle ? String(cycle._id) : cycleId;
  const billings = billingCycleId ? await SocietyBilling.find({ billingCycleId }).lean() : [];
  const claims = billingCycleId ? await Claim.find({ billingCycleId }).lean() : [];
  const recoverables = await Recoverable.find().lean();
  const payments = billingCycleId ? await Payment.find({ billingCycleId }).lean() : [];

  const totalMilkProcured = sum(billings, (row) => row.totalMilkQty);
  const totalPayable = sum(billings, (row) => row.milkAmount);
  const totalDeductions = sum(billings, (row) => Number(row.totalRecoverables || 0) + Number(row.totalSchemeDeductions || 0) + Number(row.transportPenalty || 0));
  const netPayout = sum(billings, (row) => row.netPayable);
  const claimsAmount = sum(claims, (row) => row.amount);
  const recoverablesAmount = sum(recoverables, (row) => row.remainingAmount);
  const paymentAmount = sum(payments.filter((payment) => payment.status === "SUCCESS"), (row) => row.amount);
  const invoiceCount = payments.filter((payment) => payment.status === "SUCCESS").length;

  return {
    role: "Account",
    label: "account001",
    date,
    filters: { cycleId: billingCycleId || "" },
    cards: toCards([
      { label: "Total Milk Procured", value: `${Number(totalMilkProcured).toLocaleString("en-IN")} L`, sub: cycle?.code || billingCycleId || "Current cycle" },
      { label: "Total Payable", value: `Rs ${toMoney(totalPayable).toLocaleString("en-IN")}`, sub: "Billing amount" },
      { label: "Total Deductions", value: `Rs ${toMoney(totalDeductions).toLocaleString("en-IN")}`, sub: "All deductions" },
      { label: "Net Payout", value: `Rs ${toMoney(netPayout).toLocaleString("en-IN")}`, sub: "After deductions" },
      { label: "Claims", value: `Rs ${toMoney(claimsAmount).toLocaleString("en-IN")}`, sub: `${claims.length} records` },
      { label: "Recoverables", value: `Rs ${toMoney(recoverablesAmount).toLocaleString("en-IN")}`, sub: `${recoverables.length} records` },
      { label: "Society Payments", value: `Rs ${toMoney(paymentAmount).toLocaleString("en-IN")}`, sub: `${payments.filter((payment) => payment.status === "SUCCESS").length} records` },
      { label: "Invoices", value: String(invoiceCount), sub: "Sent" },
    ]),
  };
}

async function buildDairyAudit(req) {
  const { date, from, to } = getDateRange(req);
  const entries = await MilkEntry.find({ date: { $gte: from, $lte: to } }).lean();
  const verifications = await Verification.find({ date: { $gte: from, $lte: to } }).lean();
  const verifiedSocieties = new Set(verifications.filter((row) => row.verifyChoice === "YES").map((row) => row.societyId));

  const milkReceived = sum(entries, (entry) => entry.qty);
  const tankerCount = entries.length;
  const pendingVerification = Math.max(0, entries.length - verifiedSocieties.size);
  const totalShortage = sum(entries, (entry) => Number(entry.transportPenalty || 0));
  const penaltyDeduction = totalShortage;

  return {
    role: "Diary",
    label: "DAIRY_001",
    date,
    filters: { from, to },
    cards: toCards([
      { label: "Milk Received Today", value: `${Number(milkReceived).toLocaleString("en-IN")} L`, sub: "Current shift" },
      { label: "Tankers Received", value: String(tankerCount), sub: "Today" },
      { label: "Pending Verification", value: String(pendingVerification), sub: "Tankers" },
      { label: "Total Shortage Today", value: `${Number(totalShortage).toLocaleString("en-IN")} L`, sub: "Shortage" },
      { label: "Penalty Deduction", value: `Rs ${toMoney(penaltyDeduction).toLocaleString("en-IN")}`, sub: "From milk receipt" },
    ]),
  };
}

export async function listAuditReportTypes(req, res) {
  res.json({
    data: ["Society", "BMC", "Admin", "Account", "Diary"],
  });
}

export async function getAuditReport(req, res) {
  const role = String(req.params.role || req.query.role || "").trim().toLowerCase();

  if (role === "society") {
    return res.json({ data: await buildSocietyAudit(req) });
  }
  if (role === "bmc") {
    return res.json({ data: await buildBmcAudit(req) });
  }
  if (role === "admin") {
    return res.json({ data: await buildAdminAudit(req) });
  }
  if (role === "account" || role === "accounts") {
    return res.json({ data: await buildAccountAudit(req) });
  }
  if (role === "diary" || role === "dairy") {
    return res.json({ data: await buildDairyAudit(req) });
  }

  return res.status(400).json({ message: "Unsupported audit report role." });
}