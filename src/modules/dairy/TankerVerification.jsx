import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listTankerVerifications, updateTankerVerification } from "../../utils/api";
import "../bmc/SocietyMilkVerification.css";

const QUALITY_MIN_FAT = 3.5;
const QUALITY_MIN_SNF = 8.5;
const DEFAULT_REPORT_MILK_SUMMARY = {
  cowExpected: "",
  cowReceived: "",
  buffaloExpected: "",
  buffaloReceived: "",
};
const DEFAULT_REPORT_QUALITY = {
  cowFat: "",
  cowSmp: "",
  buffaloFat: "",
  buffaloSmp: "",
};

function useClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const amPm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      const pad = (value) => String(value).padStart(2, "0");
      setTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)} ${amPm}`);
    };

    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, []);

  return time;
}

function calculateTotals(stops = []) {
  return stops.reduce(
    (acc, stop) => {
      const expected = Number(stop.expected) || 0;
      const received = Number(stop.received) || 0;
      const shortage = Math.max(expected - received, 0);
      return {
        expected: acc.expected + expected,
        received: acc.received + received,
        shortage: acc.shortage + shortage,
      };
    },
    { expected: 0, received: 0, shortage: 0 }
  );
}

function findQualityValue(qualityRows = [], parameterName = "") {
  const match = qualityRows.find(
    (item) => String(item.parameter || "").trim().toLowerCase() === parameterName.trim().toLowerCase()
  );
  const numeric = Number(match?.dairyTest);
  return Number.isFinite(numeric) ? numeric : NaN;
}

function isShipmentGoodQuality(shipment) {
  const fat = findQualityValue(shipment?.quality || [], "fat");
  const snf = findQualityValue(shipment?.quality || [], "snf");
  if (!Number.isFinite(fat) || !Number.isFinite(snf)) return false;
  return fat >= QUALITY_MIN_FAT && snf >= QUALITY_MIN_SNF;
}

function toFriendlyErrorMessage(err, fallback) {
  const message = String(err?.message || "").toLowerCase();
  if (message.includes("forbidden") || message.includes("request failed (403)")) {
    return "Access denied for tanker verification. Please login using a Dairy account.";
  }
  return err?.message || fallback;
}

export default function DairyTankerVerification() {
  const clock = useClock();
  const dateStr = new Date().toLocaleDateString("en-IN");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState("");
  const [showReportIssueTables, setShowReportIssueTables] = useState(false);
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [savedRecord, setSavedRecord] = useState(null);
  const [reportMilkSummary, setReportMilkSummary] = useState(DEFAULT_REPORT_MILK_SUMMARY);
  const [reportQuality, setReportQuality] = useState(DEFAULT_REPORT_QUALITY);
  const [issueComparisonGroups, setIssueComparisonGroups] = useState([]);
  const [issueDraftSaved, setIssueDraftSaved] = useState(false);
  const [issueFinalSubmitClicked, setIssueFinalSubmitClicked] = useState(false);
  const [decisionMode, setDecisionMode] = useState("");
  const savePanelRef = useRef(null);
  const showIssueResultSections = showReportIssueTables && issueComparisonGroups.length > 0;

  useEffect(() => {
    if (!showSavePanel) return;
    if (!savePanelRef.current) return;
    savePanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showSavePanel, saving, saveSuccess, saveError, savedRecord]);

  const loadShipments = useCallback(async (mode = "initial") => {
    try {
      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError("");
      const res = await listTankerVerifications();
      const list = Array.isArray(res?.data) ? res.data : [];
      setShipments(list);
      setSelectedShipmentId((prev) => (prev && !list.some((item) => item.id === prev) ? "" : prev));
    } catch (err) {
      setError(toFriendlyErrorMessage(err, "Failed to load tanker verifications"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadShipments("initial");
  }, [loadShipments]);

  const handleRefresh = () => {
    loadShipments("manual");
  };

  const shipmentSummaries = useMemo(
    () =>
      shipments.map((item) => {
        const totals = calculateTotals(item.stops || []);
        const societies = (item.stops || []).reduce((sum, stop) => sum + (Number(stop.societies) || 0), 0);
        return {
          id: item.id,
          tankerId: item.tankerId,
          route: item.route,
          bmc: item.stops?.[0]?.bmc || "-",
          societies,
          expected: totals.expected,
          received: totals.received,
          status: item.status,
        };
      }),
    [shipments]
  );

  const activeShipment = useMemo(() => {
    if (selectedShipmentId) {
      return shipments.find((item) => item.id === selectedShipmentId) || null;
    }
    return null;
  }, [selectedShipmentId, shipments]);

  const [shipment, setShipment] = useState(null);
  const [rows, setRows] = useState([]);
  const [qualityRows, setQualityRows] = useState([]);

  useEffect(() => {
    setRows(shipment?.stops || []);
    setQualityRows(shipment?.quality || []);
  }, [shipment]);

  useEffect(() => {
    setShipment(activeShipment);
  }, [activeShipment]);

  const totals = useMemo(() => calculateTotals(rows), [rows]);

  const isVerificationLocked = useMemo(() => {
    return false;
  }, [shipment]);

  const milkSummaryRows = useMemo(() => {
    const grouped = rows.reduce(
      (acc, row) => {
        const key = String(row.milkType || "").toLowerCase().includes("buffalo") ? "buffalo" : "cow";
        acc[key].expected += Number(row.expected) || 0;
        acc[key].received += Number(row.received) || 0;
        return acc;
      },
      {
        cow: { label: "Cow Milk", expected: 0, received: 0 },
        buffalo: { label: "Buffalo Milk", expected: 0, received: 0 },
      }
    );

    return [grouped.cow, grouped.buffalo];
  }, [rows]);

  const qualityMap = useMemo(() => {
    const byKey = { fat: { route: "-", dairy: "-" }, snf: { route: "-", dairy: "-" }, temp: { route: "-", dairy: "-" } };
    qualityRows.forEach((item) => {
      const parameter = String(item.parameter || "").trim().toLowerCase();
      if (parameter === "fat") {
        byKey.fat = { route: item.routeSheet || "-", dairy: item.dairyTest || "-" };
      }
      if (parameter === "snf") {
        byKey.snf = { route: item.routeSheet || "-", dairy: item.dairyTest || "-" };
      }
      if (parameter === "temperature") {
        byKey.temp = { route: item.routeSheet || "-", dairy: item.dairyTest || "-" };
      }
    });
    return byKey;
  }, [qualityRows]);

  const handleReceivedChange = (index, value) => {
    const nextValue = Number(value);
    setRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              received: Number.isFinite(nextValue) ? nextValue : 0,
            }
          : row
      )
    );
  };

  const handleQualityChange = (index, value) => {
    setQualityRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              dairyTest: value,
            }
          : row
      )
    );
  };

  const saveStatus = async ({ status, reportedIssue = undefined, comparisonStatus, verifyChoice }) => {
    if (!shipment?.id) return false;

    const payload = {
      stops: rows,
      quality: qualityRows,
      status,
    };

    if (reportedIssue !== undefined) {
      payload.reportedIssue = reportedIssue;
    }

    try {
      setSaving(true);
      setError("");
      setSaveError("");
      setSaveSuccess("");
      const res = await updateTankerVerification(shipment.id, payload);
      const updated = res?.data;
      if (!updated) return false;

      setShipments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setShipment(updated);
      setSavedRecord({
        savedAt: new Date().toLocaleString("en-IN"),
        savedBy: localStorage.getItem("dairy_name") || "Dairy Operator",
        comparisonStatus: comparisonStatus || updated.status || status,
        verifyChoice: verifyChoice || (status === "approved" ? "YES" : "NO"),
        totalQty: totals.received,
      });
      setSaveSuccess("Tanker verification saved successfully.");
      return true;
    } catch (err) {
      const message = toFriendlyErrorMessage(err, "Failed to save tanker verification");
      setError(message);
      setSaveError(message);
      setSavedRecord(null);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (isVerificationLocked) return;
    setDecisionMode("approve");
    setShowReportIssueTables(false);
    setShowSavePanel(true);
    setSaveError("");
    setSaveSuccess("Approval in progress...");
    setSavedRecord({
      savedAt: new Date().toLocaleString("en-IN"),
      savedBy: localStorage.getItem("dairy_name") || "Dairy Operator",
      comparisonStatus: "Saving...",
      verifyChoice: "YES",
      totalQty: totals.received,
    });
    const isSaved = await saveStatus({ status: "approved", reportedIssue: null, comparisonStatus: "Approved", verifyChoice: "YES" });
    if (isSaved) {
      window.alert("Approved successfully");
    }
  };

  const handleReject = () => {
    if (isVerificationLocked) return;
    setDecisionMode("report");
    setShowReportIssueTables(true);
    setShowSavePanel(false);
    setIssueComparisonGroups([]);
    setIssueDraftSaved(false);
    setIssueFinalSubmitClicked(false);
    setSaveError("");
    setSaveSuccess("");
    setSavedRecord(null);
    setReportMilkSummary({ ...DEFAULT_REPORT_MILK_SUMMARY });
    setReportQuality({ ...DEFAULT_REPORT_QUALITY });
  };

  const handleReportMilkSummaryChange = (field, value) => {
    setReportMilkSummary((prev) => ({ ...prev, [field]: value }));
  };

  const handleReportQualityChange = (field, value) => {
    setReportQuality((prev) => ({ ...prev, [field]: value }));
  };

  const valueOrZero = (value) => String(value || "0");

  const buildIssueComparisonGroups = () => {
    const actualCow = milkSummaryRows.find((item) => item.label === "Cow Milk") || { expected: 0, received: 0 };
    const actualBuffalo = milkSummaryRows.find((item) => item.label === "Buffalo Milk") || { expected: 0, received: 0 };
    return [
      {
        type: "Cow Milk",
        received: {
          fat: String(qualityMap.fat.route ?? "-"),
          snf: String(qualityMap.snf.route ?? "-"),
          qty: String(actualCow.received ?? 0),
        },
        added: {
          fat: valueOrZero(reportQuality.cowFat),
          snf: valueOrZero(reportQuality.cowSmp),
          qty: valueOrZero(reportMilkSummary.cowReceived),
        },
      },
      {
        type: "Buffalo Milk",
        received: {
          fat: String(qualityMap.fat.dairy ?? "-"),
          snf: String(qualityMap.snf.dairy ?? "-"),
          qty: String(actualBuffalo.received ?? 0),
        },
        added: {
          fat: valueOrZero(reportQuality.buffaloFat),
          snf: valueOrZero(reportQuality.buffaloSmp),
          qty: valueOrZero(reportMilkSummary.buffaloReceived),
        },
      },
    ];
  };

  const handleSaveIssueDraft = () => {
    if (isVerificationLocked) return;
    const groups = buildIssueComparisonGroups();
    setIssueComparisonGroups(groups);
    setIssueDraftSaved(true);
    setIssueFinalSubmitClicked(false);
    window.alert("saved successfully");
  };

  const handleSubmitIssue = async () => {
    if (isVerificationLocked) return;
    setIssueFinalSubmitClicked(true);
    const groups = issueComparisonGroups.length > 0 ? issueComparisonGroups : buildIssueComparisonGroups();

    if (issueComparisonGroups.length === 0) {
      setIssueComparisonGroups(groups);
    }

    const isSaved = await saveStatus({
      status: "approved",
      reportedIssue: {
        reportMilkSummary,
        reportQuality,
        issueComparisonGroups: groups,
      },
      comparisonStatus: "approved",
      verifyChoice: "SUBMIT",
    });
    setIssueDraftSaved(true);
    if (isSaved) {
      window.alert("Submitted successfully");
    }
  };

  const statusLabelMap = {
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    penalty: "Penalty",
  };

  const statusClassMap = {
    approved: "text-[#15803D]",
    pending: "text-[#D97706]",
    rejected: "text-[#D97706]",
    penalty: "text-[#D97706]",
  };

  const handleViewShipment = (shipmentId) => {
    setSelectedShipmentId(shipmentId);
    setShowReportIssueTables(false);
    setShowSavePanel(false);
    setSaveError("");
    setSaveSuccess("");
    setSavedRecord(null);

    const selected = shipments.find((item) => item.id === shipmentId);
    const groups = selected?.reportedIssue?.issueComparisonGroups || [];
    setDecisionMode("");
    setIssueComparisonGroups(groups);
    setIssueDraftSaved(false);
    setIssueFinalSubmitClicked(false);

    if (selected?.reportedIssue?.reportMilkSummary) {
      setReportMilkSummary(selected.reportedIssue.reportMilkSummary);
    }
    if (selected?.reportedIssue?.reportQuality) {
      setReportQuality(selected.reportedIssue.reportQuality);
    }
  };

  const handleBackToList = () => {
    setSelectedShipmentId("");
    setDecisionMode("");
    setShowReportIssueTables(false);
    setShowSavePanel(false);
    setIssueComparisonGroups([]);
    setIssueDraftSaved(false);
    setIssueFinalSubmitClicked(false);
    setSaveError("");
    setSaveSuccess("");
    setSavedRecord(null);
  };

  const parseNumeric = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const disableApproveAction =
    saving ||
    isVerificationLocked ||
    decisionMode === "report";

  const disableReportAction =
    saving ||
    isVerificationLocked ||
    decisionMode === "approve";

  const disableReportIssueEntryInputs =
    saving ||
    isVerificationLocked ||
    issueFinalSubmitClicked;

  const getIndicatorMeta = (received, added) => {
    const receivedNum = parseNumeric(received);
    const addedNum = parseNumeric(added);
    if (receivedNum === null || addedNum === null) {
      return { hasValue: false, textClass: "text-[#1F2937]", symbol: "" };
    }

    if (addedNum < receivedNum) {
      return { hasValue: true, textClass: "text-[#B91C1C]", symbol: "▼" };
    }

    return { hasValue: true, textClass: "text-[#15803D]", symbol: "▲" };
  };

  return (
    <div className="bmc-verify" style={{ background: "linear-gradient(180deg,#F7FAFF_0%,#EEF4FF_100%)", minHeight: "100vh", color: "#0F1E33" }}>
      <header className="topbar">
        <div className="topbar-left">
          <span className="page-title">Tanker Verification</span>
          <span className="date-badge">{dateStr}</span>
        </div>
        <div className="topbar-right">
          <div className="live-time">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {clock}
          </div>
        </div>
      </header>

      <div className="content">
        <section className="section-card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-dot" />
              Active Trips
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-sm font-medium text-[#374151] hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="society-main-table min-w-[760px] text-[15px] text-[#111827]">
              <thead className="text-[#374151]">
                <tr>
                  <th>Tanker ID</th>
                  <th>Route</th>
                  <th>BMC</th>
                  <th>Societies</th>
                  <th>Expected</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shipmentSummaries.map((item) => {
                  const status = statusLabelMap[item.status] || "Pending";
                  return (
                    <tr key={item.id}>
                      <td>{item.tankerId}</td>
                      <td>{item.route || "-"}</td>
                      <td>{item.bmc}</td>
                      <td>{item.societies}</td>
                      <td className="text-center tabular-nums">{item.expected} L</td>
                      <td className="text-center tabular-nums">{item.received} L</td>
                      <td className={`font-medium ${statusClassMap[item.status] || "text-[#D97706]"}`}>{status}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleViewShipment(item.id)}
                          className="rounded-md bg-[#2F7FB4] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2A6F9D]"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!shipmentSummaries.length && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-sm text-[#6B7280]">
                      No tankers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {loading && <p className="text-sm text-[#5B6B7F]">Loading trip verification data...</p>}
        {!loading && !shipmentSummaries.length && !error && (
          <p className="text-sm text-[#5B6B7F]">No trip data found for verification.</p>
        )}
        {error && <p className="text-sm text-[#DC2626]">{error}</p>}

        {shipment ? (
          <>
        <section className="section-card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-dot" />
              Tanker Details
            </div>
            <button
              type="button"
              onClick={handleBackToList}
              className="rounded px-2 py-1 text-sm font-medium text-[#374151] hover:bg-[#E5E7EB]"
            >
              Back
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="society-main-table min-w-[760px] text-sm text-[#1F2937]">
              <thead className="text-[#374151]">
                <tr>
                  <th>Tanker ID</th>
                  <th>Route</th>
                  <th>BMC</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="tabular-nums">{shipment.tankerId}</td>
                  <td className="tabular-nums">{shipment.route || "-"}</td>
                  <td className="tabular-nums">{rows[0]?.bmc || shipment.route || "-"}</td>
                  <td className="tabular-nums">{statusLabelMap[shipment.status] || "Pending"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-dot" />
              Milk Summary
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="society-main-table min-w-[680px] table-fixed text-sm text-[#1F2937]" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "40%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "30%" }} />
              </colgroup>
              <thead className="text-[#374151]">
                <tr>
                  <th>Milk Type</th>
                  <th style={{ textAlign: "center" }}>Expected</th>
                  <th style={{ textAlign: "center" }}>Received</th>
                </tr>
              </thead>
              <tbody>
                {milkSummaryRows.map((item) => (
                  <tr key={item.label}>
                    <td className="font-medium">{item.label}</td>
                    <td style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{item.expected} L</td>
                    <td style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{item.received} L</td>
                  </tr>
                ))}
                <tr>
                  <td className="font-semibold">Shortage</td>
                  <td style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }} className="font-semibold text-[#EF4444]">{totals.shortage} L</td>
                  <td style={{ textAlign: "center" }} />
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-dot" />
              Quality Check
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="society-main-table min-w-[680px] table-fixed text-sm text-[#1F2937]" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "40%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "30%" }} />
              </colgroup>
              <thead className="text-[#374151]">
                <tr>
                  <th>Milk Type</th>
                  <th style={{ textAlign: "center" }}>Fat</th>
                  <th style={{ textAlign: "center" }}>SNF</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">Cow Milk</td>
                  <td style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{qualityMap.fat.route}</td>
                  <td style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{qualityMap.snf.route}</td>
                </tr>
                <tr>
                  <td className="font-medium">Buffalo Milk</td>
                  <td style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{qualityMap.fat.dairy}</td>
                  <td style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{qualityMap.snf.dairy}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="verify-section section-card">
          <div className="verify-label">Do tanker values match trip verification?</div>
          <div className="verify-options">
            <button
              type="button"
              onClick={handleApprove}
              disabled={disableApproveAction}
              className="verify-option sel-yes"
            >
              <div className="radio-circle">
                <div className="radio-filled" />
              </div>
              {saving ? "Saving..." : "Approve Tanker"}
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={disableReportAction}
              className="verify-option sel-no"
            >
              <div className="radio-circle">
                <div className="radio-filled" />
              </div>
              Report Issue
            </button>
          </div>
          {isVerificationLocked && (
            <p className="mt-3 text-xs font-medium text-[#6B7280]">
              Verification is locked for this tanker after final submission.
            </p>
          )}
        </div>

        {!showReportIssueTables && (showSavePanel || saving || saveError || saveSuccess || savedRecord) && (
          <section ref={savePanelRef} className="section-card">
            {(saving || saveError || saveSuccess) && (
              <div className="verify-section" style={{ borderTop: "none" }}>
                <div className="verify-label">Save Status</div>
                <div className="text-sm">
                  {saving && <p className="text-[#1D4ED8]">Saving tanker verification...</p>}
                  {saveError && <p className="text-[#DC2626]">{saveError}</p>}
                  {saveSuccess && <p className="text-[#15803D]">{saveSuccess}</p>}
                </div>
              </div>
            )}

            {savedRecord && (
              <div className="verify-section" style={{ paddingTop: 0 }}>
                <div className="verify-label">Saved Verification Details</div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#374151]">
                  <span className="rounded-full bg-[#EEF4FF] px-3 py-1">Status: {savedRecord.comparisonStatus}</span>
                  <span className="rounded-full bg-[#EEF4FF] px-3 py-1">Physical Check: {savedRecord.verifyChoice}</span>
                  <span className="rounded-full bg-[#EEF4FF] px-3 py-1">Total Qty: {savedRecord.totalQty} L</span>
                </div>
                <p className="mt-3 text-sm text-[#6B7280]">
                  Saved at {savedRecord.savedAt} by {savedRecord.savedBy}
                </p>
              </div>
            )}
          </section>
        )}

        {error && <p className="text-sm text-[#DC2626]">{error}</p>}

        {showReportIssueTables && (
          <section className="section-card">
            <div className="card-header">
              <div className="card-title">
                <span className="card-title-dot" />
                Report Issue Entry
              </div>
            </div>

            <div className="verify-section">
              <div className="verify-label">Milk Summary</div>
              <div className="overflow-x-auto">
                <table className="society-main-table min-w-[680px] table-fixed text-sm text-[#1F2937]">
                  <colgroup>
                    <col style={{ width: "40%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "30%" }} />
                  </colgroup>
                  <thead className="text-[#374151]">
                    <tr>
                      <th>Milk Type</th>
                      <th style={{ textAlign: "center" }}>Expected</th>
                      <th style={{ textAlign: "center" }}>Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-medium">Cow Milk</td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={milkSummaryRows.find((item) => item.label === "Cow Milk")?.expected ?? 0}
                          readOnly
                          disabled
                          className="report-entry-qty mx-auto block cursor-not-allowed bg-[#EEF2F7] text-[#6B7280]"
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={reportMilkSummary.cowReceived}
                          onChange={(event) => handleReportMilkSummaryChange("cowReceived", event.target.value)}
                          disabled={disableReportIssueEntryInputs}
                          placeholder="0.00"
                          className="report-entry-qty mx-auto block"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium">Buffalo Milk</td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={milkSummaryRows.find((item) => item.label === "Buffalo Milk")?.expected ?? 0}
                          readOnly
                          disabled
                          className="report-entry-qty mx-auto block cursor-not-allowed bg-[#EEF2F7] text-[#6B7280]"
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={reportMilkSummary.buffaloReceived}
                          onChange={(event) => handleReportMilkSummaryChange("buffaloReceived", event.target.value)}
                          disabled={disableReportIssueEntryInputs}
                          placeholder="0.00"
                          className="report-entry-qty mx-auto block"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="verify-section">
              <div className="verify-label">Quality Check</div>
              <div className="overflow-x-auto">
                <table className="society-main-table min-w-[680px] table-fixed text-sm text-[#1F2937]">
                  <colgroup>
                    <col style={{ width: "40%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "30%" }} />
                  </colgroup>
                  <thead className="text-[#374151]">
                    <tr>
                      <th>Milk Type</th>
                      <th style={{ textAlign: "center" }}>FAT %</th>
                      <th style={{ textAlign: "center" }}>SNF %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-medium">Cow Milk</td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={reportQuality.cowFat}
                          onChange={(event) => handleReportQualityChange("cowFat", event.target.value)}
                          disabled={disableReportIssueEntryInputs}
                          placeholder="0.0"
                          className="report-entry-input mx-auto block"
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={reportQuality.cowSmp}
                          onChange={(event) => handleReportQualityChange("cowSmp", event.target.value)}
                          disabled={disableReportIssueEntryInputs}
                          placeholder="0.0"
                          className="report-entry-input mx-auto block"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium">Buffalo Milk</td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={reportQuality.buffaloFat}
                          onChange={(event) => handleReportQualityChange("buffaloFat", event.target.value)}
                          disabled={disableReportIssueEntryInputs}
                          placeholder="0.0"
                          className="report-entry-input mx-auto block"
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={reportQuality.buffaloSmp}
                          onChange={(event) => handleReportQualityChange("buffaloSmp", event.target.value)}
                          disabled={disableReportIssueEntryInputs}
                          placeholder="0.0"
                          className="report-entry-input mx-auto block"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {issueComparisonGroups.length > 0 && (
              <div className="verify-section">
                <div className="verify-label">Comparison Table</div>
                <div className="overflow-x-auto">
                  <table className="society-main-table min-w-[680px] text-sm text-[#1F2937]">
                    <thead className="text-[#374151]">
                      <tr>
                        <th>Type</th>
                        <th>Source</th>
                        <th>Fat%</th>
                        <th>SNF%</th>
                        <th>Qty (L)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issueComparisonGroups.map((group) => {
                        const fatIndicator = getIndicatorMeta(group.received.fat, group.added.fat);
                        const snfIndicator = getIndicatorMeta(group.received.snf, group.added.snf);
                        const qtyIndicator = getIndicatorMeta(group.received.qty, group.added.qty);

                        return [
                          <tr key={`${group.type}-received`}>
                            <td className="font-medium">{group.type}</td>
                            <td>Received</td>
                            <td className="tabular-nums">{group.received.fat}</td>
                            <td className="tabular-nums">{group.received.snf}</td>
                            <td className="tabular-nums">{group.received.qty}</td>
                          </tr>,
                          <tr key={`${group.type}-added`}>
                            <td />
                            <td className="font-semibold text-[#B91C1C]">Added</td>
                            <td className={`font-semibold ${fatIndicator.textClass}`}>
                              <span className="inline-flex items-center gap-1">
                                {group.added.fat}
                                {fatIndicator.hasValue && <span aria-hidden="true">{fatIndicator.symbol}</span>}
                              </span>
                            </td>
                            <td className={`font-semibold ${snfIndicator.textClass}`}>
                              <span className="inline-flex items-center gap-1">
                                {group.added.snf}
                                {snfIndicator.hasValue && <span aria-hidden="true">{snfIndicator.symbol}</span>}
                              </span>
                            </td>
                            <td className={`font-semibold ${qtyIndicator.textClass}`}>
                              <span className="inline-flex items-center gap-1">
                                {group.added.qty}
                                {qtyIndicator.hasValue && <span aria-hidden="true">{qtyIndicator.symbol}</span>}
                              </span>
                            </td>
                          </tr>,
                        ];
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!issueDraftSaved && (
              <div className="verify-section">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveIssueDraft}
                    disabled={saving || isVerificationLocked}
                    className="rounded-md bg-[#1E4B6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173A55]"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {issueDraftSaved && issueComparisonGroups.length > 0 && (
              <div className="verify-section" style={{ borderTop: "none", paddingTop: 0 }}>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitIssue}
                    disabled={saving || isVerificationLocked}
                    className="rounded-md bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59]"
                  >
                    {saving ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            )}

            {showIssueResultSections && issueFinalSubmitClicked && (saveError || saveSuccess) && (
              <div className="verify-section">
                <div className="verify-label">Save Status</div>
                <div className="text-sm">
                  {saveError && <p className="text-[#DC2626]">{saveError}</p>}
                  {saveSuccess && <p className="text-[#15803D]">{saveSuccess}</p>}
                </div>
              </div>
            )}

            {showIssueResultSections && issueFinalSubmitClicked && savedRecord && (
              <div className="verify-section" style={{ paddingTop: 0 }}>
                <div className="verify-label">Saved Verification Details</div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#374151]">
                  <span className="rounded-full bg-[#EEF4FF] px-3 py-1">Status: {savedRecord.comparisonStatus}</span>
                  <span className="rounded-full bg-[#EEF4FF] px-3 py-1">Physical Check: {savedRecord.verifyChoice}</span>
                  <span className="rounded-full bg-[#EEF4FF] px-3 py-1">Total Qty: {savedRecord.totalQty} L</span>
                </div>
                <p className="mt-3 text-sm text-[#6B7280]">
                  Saved at {savedRecord.savedAt} by {savedRecord.savedBy}
                </p>
              </div>
            )}
          </section>
        )}
          </>
        ) : (
          !loading &&
          shipmentSummaries.length > 0 && (
            <section className="section-card">
              <div className="p-5 text-sm text-[#5B6B7F]">Click View in Active Trips to open tanker details.</div>
            </section>
          )
        )}
      </div>
    </div>
  );
}
