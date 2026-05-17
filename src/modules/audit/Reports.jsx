import React, { useState, useEffect } from "react";
import { fetchAuditReport, fetchBillingCycles, fetchSocieties } from "../../utils/api";

// Entity lists for each role
const DEFAULT_SOCIETIES = [];
const ADMINS = [
  { id: "admin001", name: "admin001", label: "admin001" },
];

const ACCOUNTS = [
  { id: "account001", name: "account001", label: "account001" },
];

const DIARIES = [
  { id: "DAIRY_001", name: "DAIRY_001", label: "DAIRY_001" },
];

const MOCK_DATA = [
  { id: "SOCIETY_001", role: "Society", name: "SOCIETY_001", contact: "9876543210", extra: "District: Raichur" },
  { id: "SOCIETY_002", role: "Society", name: "SOCIETY_002", contact: "9876543209", extra: "District: Hubli" },
  { id: "BMC_001", role: "BMC", name: "BMC_001", contact: "9123456780", extra: "Location: Depot A" },
  { id: "BMC_002", role: "BMC", name: "BMC_002", contact: "9123456781", extra: "Location: Depot B" },
  { id: "admin001", role: "Admin", name: "admin001", contact: "9000000000", extra: "Super admin" },
  { id: "DIARY_001", role: "Diary", name: "Daily Entry 1", contact: "2024-01-15", extra: "Morning collection report" },
  { id: "DIARY_002", role: "Diary", name: "Daily Entry 2", contact: "2024-01-16", extra: "Evening dispatch summary" },
];

// SOCIETY Mock Data - for each society
const SOCIETY_MOCK_DATA = {
  "SOCIETY_001": {
    summary: {
      totalMilk: 2450,
      totalFarmers: 145,
      verified: 92,
      type: { cow: 1200, buffalo: 1250 },
      session: { morning: 1100, evening: 1350 },
      points: 8,
      rejected: 3,
    },
  },
  "SOCIETY_002": {
    summary: {
      totalMilk: 3120,
      totalFarmers: 178,
      verified: 95,
      type: { cow: 1650, buffalo: 1470 },
      session: { morning: 1450, evening: 1670 },
      points: 12,
      rejected: 2,
    },
  },
  "SOCIETY_003": {
    summary: {
      totalMilk: 1880,
      totalFarmers: 112,
      verified: 88,
      type: { cow: 920, buffalo: 960 },
      session: { morning: 850, evening: 1030 },
      points: 6,
      rejected: 5,
    },
  },
};

// BMC Mock Data - for each BMC
const BMC_MOCK_DATA = {
  "BMC_001": {
    summary: {
      totalMilk: 5400,
      totalVerified: 5200,
      acceptanceRate: 96.3,
      type: { cow: 2700, buffalo: 2700 },
      storageUsed: 78,
      rejected: 200,
      societiesCount: 5,
    },
    dispatchStats: { totalDispatches: 18 },
  },
  "BMC_002": {
    summary: {
      totalMilk: 6200,
      totalVerified: 5950,
      acceptanceRate: 95.97,
      type: { cow: 3100, buffalo: 3100 },
      storageUsed: 82,
      rejected: 250,
      societiesCount: 7,
    },
    dispatchStats: { totalDispatches: 22 },
  },
  "BMC_003": {
    summary: {
      totalMilk: 4100,
      totalVerified: 3980,
      acceptanceRate: 97.07,
      type: { cow: 2050, buffalo: 2050 },
      storageUsed: 65,
      rejected: 120,
      societiesCount: 4,
    },
    dispatchStats: { totalDispatches: 14 },
  },
};

// ADMIN Mock Data
const ADMIN_MOCK_DATA = {
  "admin001": {
    dcsCount: 884,
    bmcCount: 70,
    dairyUnitsCount: 3,
    eosCount: 27,
    societiesCount: 120,
    farmersCount: 2450,
    totalMilkCollected: 458000,
  },
};

// DIARY Mock Data - for each dairy
const DIARY_MOCK_DATA = {
  "DAIRY_001": {
    milkReceived: 18450,
    tankerCount: 28,
    pendingVerification: 6,
    totalShortage: 420,
    penaltyDeduction: 14700,
    totalEntries: 156,
    completedRecords: 148,
    pendingRecords: 8,
    transactions: 312,
    completionRate: 94.87,
    lastUpdated: "14:32:00",
    avgTime: 5.2,
    errorRecords: 3,
    verifiedBy: "Admin - Super Admin",
  },
};

export default function AuditReports() {
  const [roleFilter, setRoleFilter] = useState("Society");
  const [societies, setSocieties] = useState(DEFAULT_SOCIETIES);
  const [bmcEntities, setBmcEntities] = useState([]);
  const [accountCycles, setAccountCycles] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); // Today's date
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSocieties() {
      try {
        const response = await fetchSocieties();
        if (cancelled) return;

        const list = Array.isArray(response?.data) ? response.data : [];
        const nextSocieties = list.map((society) => ({
          id: society.societyId,
          name: society.societyName || society.societyId,
          label: society.societyName || society.societyId,
        }));

        const nextBmcEntities = Array.from(
          new Map(
            list
              .filter((society) => society.bmcId)
              .map((society) => [society.bmcId, {
                id: society.bmcId,
                name: society.bmcId,
                label: society.bmcId,
              }])
          ).values()
        ).sort((left, right) => left.label.localeCompare(right.label));

        setSocieties(nextSocieties);
        setBmcEntities(nextBmcEntities);
        if (!selectedEntity && nextSocieties.length > 0) {
          setSelectedEntity(nextSocieties[0].id);
        }
      } catch (error) {
        if (!cancelled) {
          setSummaryError(error?.message || "Failed to load societies.");
        }
      }
    }

    async function loadAccountCycles() {
      try {
        const response = await fetchBillingCycles();
        if (cancelled) return;

        const list = Array.isArray(response?.data) ? response.data : [];
        const nextCycles = list
          .map((cycle) => ({
            id: cycle.id || cycle.code,
            name: cycle.label || cycle.code || cycle.id,
            label: cycle.label || cycle.code || cycle.id,
          }))
          .filter((cycle) => cycle.id)
          .sort((left, right) => left.label.localeCompare(right.label));

        setAccountCycles(nextCycles);
      } catch (error) {
        if (!cancelled) {
          setSummaryError(error?.message || "Failed to load billing cycles.");
        }
      }
    }

    if (roleFilter === "Society") {
      loadSocieties();
    }

    if (roleFilter === "Account") {
      loadAccountCycles();
    }

    return () => {
      cancelled = true;
    };
  }, [roleFilter]);

  const handleSearch = async () => {
    setSearchTriggered(true);
    setSummary(null);
    setSummaryError("");
    setLoadingSummary(true);

    try {
      const params = { date: selectedDate };

      if (roleFilter === "Society") {
        const society = societies.find((s) => s.id === selectedEntity);
        if (!society) throw new Error("No society selected");
        params.societyId = society.id;
      } else if (roleFilter === "BMC") {
        const bmc = bmcEntities.find((b) => b.id === selectedEntity);
        if (!bmc) throw new Error("No BMC selected");
        params.bmcId = bmc.id;
      } else if (roleFilter === "Account") {
        // Support a local placeholder `account001` by mapping it to the latest
        // available billing cycle when present. If no cycles exist, let the
        // backend pick its default.
        if (selectedEntity === "account001") {
          if (Array.isArray(accountCycles) && accountCycles.length > 0) {
            params.cycleId = accountCycles[0].id;
          }
        } else if (accountCycles.some((cycle) => cycle.id === selectedEntity)) {
          params.cycleId = selectedEntity;
        }
      }

      const response = await fetchAuditReport(roleFilter, params);
      const backendData = response?.data || {};
      const cards = Array.isArray(backendData.cards) ? backendData.cards : [];
      const cardMap = new Map(cards.map((card) => [card.label, card.value]));
      const readNumber = (label) => Number(String(cardMap.get(label) || "0").replace(/[^0-9.-]/g, "")) || 0;
      const label = backendData.label || selectedEntity || roleFilter;

      if (roleFilter === "Society") {
        setSummary({
          role: "Society",
          label,
          date: selectedDate,
          data: {
            summary: {
              totalMilk: readNumber("Total Milk Collected"),
              totalFarmers: readNumber("Total Farmers"),
              verified: readNumber("Verification Status"),
              type: {
                cow: readNumber("Cow Milk"),
                buffalo: readNumber("Buffalo Milk"),
              },
              session: {
                morning: readNumber("Morning Collection"),
                evening: readNumber("Evening Collection"),
              },
              points: 0,
              rejected: 0,
              milkAmount: readNumber("Milk Amount"),
            },
          },
        });
      } else if (roleFilter === "BMC") {
        setSummary({
          role: "BMC",
          label,
          date: selectedDate,
          data: {
            summary: {
              totalMilk: readNumber("Total Milk Received"),
              totalVerified: readNumber("Total Verified"),
              acceptanceRate: readNumber("Acceptance Rate"),
              type: {
                cow: readNumber("Cow Milk Received"),
                buffalo: readNumber("Buffalo Milk Received"),
              },
            },
            dispatchStats: { totalDispatches: readNumber("Total Dispatches") },
          },
        });
      } else if (roleFilter === "Admin") {
        setSummary({
          role: "Admin",
          label,
          date: selectedDate,
          data: {
            dcsCount: readNumber("No. of DCS"),
            bmcCount: readNumber("No. of BMC"),
            dairyUnitsCount: readNumber("No. of Dairy Units"),
            eosCount: readNumber("No. of EO"),
          },
        });
      } else if (roleFilter === "Diary") {
        setSummary({
          role: "Diary",
          label,
          date: selectedDate,
          data: {
            milkReceived: readNumber("Milk Received Today"),
            tankerCount: readNumber("Tankers Received"),
            pendingVerification: readNumber("Pending Verification"),
            totalShortage: readNumber("Total Shortage Today"),
            penaltyDeduction: readNumber("Penalty Deduction"),
          },
        });
      } else if (roleFilter === "Account") {
        const accountCards = cards.filter((card) => card.label !== "Invoices");
        setSummary({
          role: "Account",
          label,
          date: selectedDate,
          data: {
            cards: accountCards,
            invoiceCount: readNumber("Invoices"),
          },
        });
      }
    } catch (err) {
      setSummaryError(err.message || String(err));
    } finally {
      setLoadingSummary(false);
    }
  };

  // Get the list of entities based on role
  const getEntityList = () => {
    switch (roleFilter) {
      case "Society":
        return societies;
      case "BMC":
        return bmcEntities;
      case "Admin":
        return ADMINS;
      case "Account":
        // Always show a local account placeholder first, then available billing cycles
        return [...ACCOUNTS, ...accountCycles];
      case "Diary":
        return DIARIES;
      default:
        return [];
    }
  };

  // Update selected entity when role changes
  useEffect(() => {
    const entities = getEntityList();
    if (entities.length === 0) {
      return;
    }

    const hasCurrentSelection = entities.some((entity) => entity.id === selectedEntity);
    if (!hasCurrentSelection) {
      setSelectedEntity(entities[0].id);
    }
  }, [roleFilter, societies, bmcEntities, accountCycles, selectedEntity]);

  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Audit Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Select entity and date to view audit data.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded border px-3 py-2 bg-white text-sm"
            aria-label="Filter by role"
          >
            <option value="Society">Society</option>
            <option value="BMC">BMC</option>
            <option value="Admin">Admin</option>
            <option value="Account">Account</option>
            <option value="Diary">Diary</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          className="rounded border px-3 py-2 bg-white text-sm flex-1"
          aria-label="Select entity"
        >
          {getEntityList().map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded border px-3 py-2 bg-white text-sm flex-1"
          aria-label="Select date"
        />
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={handleSearch}
          className="bg-[#1E4B6B] text-white px-6 py-2 rounded hover:bg-[#153a52] transition-colors text-sm font-medium"
          aria-label="Search audit reports"
        >
          Search
        </button>
      </div>

      {/* Summary cards fetched from dashboard endpoints */}
      {searchTriggered && (
        <div className="mb-6">
          {loadingSummary ? (
            <div className="text-sm text-slate-500">Loading audit data for {selectedDate}...</div>
          ) : summaryError ? (
            <div className="text-sm text-red-600">{summaryError}</div>
          ) : summary ? (
            <>
              {/* SOCIETY AUDIT DATA */}
              {summary.role === "Society" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Society Audit Report - {summary.label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">ENTITY</p>
                      <p className="font-semibold text-slate-800">{summary.label}</p>
                      <p className="text-xs text-slate-600 mt-2">Date: {summary.date}</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TOTAL MILK COLLECTED</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.totalMilk ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Liters</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TOTAL FARMERS</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.totalFarmers ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Active Farmers</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">VERIFICATION STATUS</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.verified ?? "0"}%</p>
                      <p className="text-xs text-slate-600 mt-2">Verified</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">COW MILK</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.type?.cow ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">% of Total</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">BUFFALO MILK</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.type?.buffalo ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">% of Total</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">MORNING COLLECTION</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.session?.morning ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Session</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">EVENING COLLECTION</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.session?.evening ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Session</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">COW MILK AMOUNT</p>
                      <p className="font-semibold text-lg text-slate-800">₹{summary.data?.summary?.type?.cow ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Cow Amount</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">BUFFALO MILK AMOUNT</p>
                      <p className="font-semibold text-lg text-slate-800">₹{summary.data?.summary?.type?.buffalo ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Buffalo Amount</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">MORNING AMOUNT</p>
                      <p className="font-semibold text-lg text-slate-800">₹{summary.data?.summary?.session?.morning ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Morning Amount</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">EVENING AMOUNT</p>
                      <p className="font-semibold text-lg text-slate-800">₹{summary.data?.summary?.session?.evening ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Evening Amount</p>
                    </div>
                  </div>
                </div>
              )}

              {/* BMC AUDIT DATA */}
              {summary.role === "BMC" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">BMC Audit Report - {summary.label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">ENTITY</p>
                      <p className="font-semibold text-slate-800">{summary.label}</p>
                      <p className="text-xs text-slate-600 mt-2">Date: {summary.date}</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TOTAL MILK RECEIVED</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.totalMilk ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">From Societies</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TOTAL VERIFIED</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.totalVerified ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Quality Approved</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">ACCEPTANCE RATE</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.acceptanceRate ?? "0"}%</p>
                      <p className="text-xs text-slate-600 mt-2">Passed QC</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">COW MILK RECEIVED</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.type?.cow ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Type A</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">BUFFALO MILK RECEIVED</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.type?.buffalo ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Type B</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TOTAL DISPATCHES</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.dispatchStats?.totalDispatches ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Batches</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ACCOUNT AUDIT DATA */}
              {summary.role === "Account" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Audit Report - {summary.label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {(summary.data?.cards || []).map((card) => (
                      <div
                        key={card.label}
                        className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <p className="text-xs text-slate-500 font-medium mb-2">{card.label.toUpperCase()}</p>
                        <p className="font-semibold text-lg text-slate-800">{card.value}</p>
                        {card.sub ? <p className="text-xs text-slate-600 mt-2">{card.sub}</p> : null}
                      </div>
                    ))}
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">INVOICES</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.invoiceCount ?? 0}</p>
                      <p className="text-xs text-slate-600 mt-2">Sent</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN AUDIT DATA */}
              {summary.role === "Admin" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Audit Report - {summary.label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">ENTITY</p>
                      <p className="font-semibold text-slate-800">{summary.label}</p>
                      <p className="text-xs text-slate-600 mt-2">Date: {summary.date}</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">NO. OF DCS</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.dcsCount ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Societies</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">NO. OF BMC</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.bmcCount ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Operational</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">NO. OF DAIRY UNITS</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.dairyUnitsCount ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Active</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">NO. OF EO</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.eosCount ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">EO</p>
                    </div>
                  </div>
                </div>
              )}

              {/* DIARY AUDIT DATA */}
              {summary.role === "Diary" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Diary Audit Report - {summary.label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">MILK RECEIVED TODAY</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.milkReceived ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Current Shift</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TANKERS RECEIVED</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.tankerCount ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Today</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">PENDING VERIFICATION</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.pendingVerification ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Tankers</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TOTAL SHORTAGE TODAY</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.totalShortage ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Shortage</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">PENALTY DEDUCTION</p>
                      <p className="font-semibold text-lg text-slate-800">Rs. {summary.data?.penaltyDeduction ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">From Milk Receipt</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
