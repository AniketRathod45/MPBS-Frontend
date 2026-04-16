import { useEffect, useMemo, useState } from "react";
import {
  createRoutePlan,
  createTanker,
  createTransport,
  getRouteNavigationOptions,
  listRoutePlans,
} from "../../utils/api";

function normalizeBmcLabel(value = "") {
  const trimmed = String(value || "").trim().toUpperCase();
  const match = trimmed.match(/^BMC[\s_-]?(\d+)$/i);
  if (match) {
    return `BMC_${String(Number(match[1])).padStart(3, "0")}`;
  }
  return trimmed;
}

function compareBmcLabel(a = "", b = "") {
  const left = normalizeBmcLabel(a);
  const right = normalizeBmcLabel(b);

  const leftMatch = left.match(/^BMC_(\d+)$/);
  const rightMatch = right.match(/^BMC_(\d+)$/);

  if (leftMatch && rightMatch) {
    return Number(leftMatch[1]) - Number(rightMatch[1]);
  }

  return left.localeCompare(right);
}

export default function RouteNavigation() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [bmcs, setBmcs] = useState([]);
  const [transports, setTransports] = useState([]);
  const [tankers, setTankers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedBmc, setSelectedBmc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");

  const [transportForm, setTransportForm] = useState({ transportId: "", name: "", phone: "" });
  const [tankerForm, setTankerForm] = useState({ tankerId: "", plateNo: "", capacityLiters: "", transportId: "" });
  const [tripForm, setTripForm] = useState({ routeCode: "", routeName: "", tankerId: "", transportId: "", bmcIds: [] });

  const sampleValues = {
    transportId: "TR-001",
    transportName: "Annapurna Logistics",
    transportPhone: "9876543210",
    tankerId: "TNK-101",
    tankerPlate: "MH12AB1234",
    tankerCapacity: "12000",
    routeCode: "RT-001",
    routeName: "Morning Collection - North",
  };

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [optionsRes, routesRes] = await Promise.all([getRouteNavigationOptions(), listRoutePlans()]);

      setBmcs(optionsRes?.data?.bmcs || []);
      setTransports(optionsRes?.data?.transports || []);
      setTankers(optionsRes?.data?.tankers || []);
      setRoutes(routesRes?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load route navigation data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const onCreateTransport = async (event) => {
    event.preventDefault();
    if (!/^[6-9]\d{9}$/.test(transportForm.phone)) {
      setError("Enter valid mobile number");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await createTransport(transportForm);
      setTransportForm({ transportId: "", name: "", phone: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create transport");
    } finally {
      setSaving(false);
    }
  };

  const onCreateTanker = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      await createTanker({
        tankerId: tankerForm.tankerId,
        plateNo: tankerForm.plateNo,
        capacityLiters: Number(tankerForm.capacityLiters),
        transportId: tankerForm.transportId || null,
      });
      setTankerForm({ tankerId: "", plateNo: "", capacityLiters: "", transportId: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create tanker");
    } finally {
      setSaving(false);
    }
  };

  const onCreateRoute = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      await createRoutePlan({
        routeCode: tripForm.routeCode,
        routeName: tripForm.routeName,
        transportId: tripForm.transportId || null,
        tankerId: tripForm.tankerId || null,
        bmcIds: tripForm.bmcIds,
      });
      setTripForm({ routeCode: "", routeName: "", transportId: "", tankerId: "", bmcIds: [] });
      setSelectedBmc("");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create trip");
    } finally {
      setSaving(false);
    }
  };

  const addBmcToSequence = () => {
    if (!selectedBmc) return;
    setTripForm((prev) => {
      if (prev.bmcIds.includes(selectedBmc)) {
        return prev;
      }
      return {
        ...prev,
        bmcIds: [...prev.bmcIds, selectedBmc],
      };
    });
    setSelectedBmc("");
  };

  const removeBmcFromSequence = (bmcId) => {
    setTripForm((prev) => ({
      ...prev,
      bmcIds: prev.bmcIds.filter((id) => id !== bmcId),
    }));
  };

  const normalizedSearchQuery = appliedSearchQuery.trim().toLowerCase();

  const onApplySearch = (event) => {
    event.preventDefault();
    setAppliedSearchQuery(searchQuery);
  };

  const filteredRoutes = useMemo(() => {
    if (!normalizedSearchQuery) return [];

    return routes.filter((item) => {
      const tankerTripId = String(item.routeCode || "").toLowerCase();
      const tankerId = String(item.tankerId?.tankerId || "").toLowerCase();
      const bmcText = (item.bmcIds || []).join(" ").toLowerCase();
      const transportText = `${item.transportId?.name || ""} ${item.transportId?.transportId || ""}`.toLowerCase();

      return (
        tankerTripId.includes(normalizedSearchQuery) ||
        tankerId.includes(normalizedSearchQuery) ||
        bmcText.includes(normalizedSearchQuery) ||
        transportText.includes(normalizedSearchQuery)
      );
    });
  }, [routes, normalizedSearchQuery]);

  const orderedBmcs = useMemo(
    () => [...new Set((bmcs || []).map(normalizeBmcLabel).filter(Boolean))].sort(compareBmcLabel),
    [bmcs]
  );

  const summaryCards = useMemo(
    () => [
      { label: "Routes", value: routes.length },
      { label: "Tankers", value: tankers.length },
      { label: "BMCs", value: orderedBmcs.length },
    ],
    [orderedBmcs.length, routes.length, tankers.length]
  );

  const renderTripRows = (tripRows) => {
    if (!tripRows.length) {
      return (
        <tr>
          <td colSpan={5} className="px-3 py-4 text-center text-[#6B7280]">
            No trips found.
          </td>
        </tr>
      );
    }

    return tripRows.map((item) => (
      <tr key={item._id} className="border-t border-[#E6EDF7]">
        <td className="px-3 py-2 font-semibold text-[#1E4B6B]">{item.routeCode}</td>
        <td className="px-3 py-2">{item.routeName}</td>
        <td className="px-3 py-2 font-semibold">
          {item.tankerId?.tankerId || "-"} ({item.tankerId?.capacityLiters || 0}L)
        </td>
        <td className="px-3 py-2 text-xs">{item.transportId?.name || "-"}</td>
        <td className="px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {(item.bmcIds || []).map((bmc, idx) => (
              <span key={idx} className="inline-block rounded-full bg-[#E0E7FF] px-2 py-1 text-xs font-semibold text-[#1E4B6B]">
                {idx + 1}. {bmc}
              </span>
            ))}
            {!item.bmcIds?.length && <span className="text-xs text-[#9CA3AF]">-</span>}
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FAFF_0%,#EEF4FF_100%)] p-6 text-[#0F1E33]">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-2xl font-semibold text-[#1E4B6B]">Route Navigation</h1>
        <p className="mt-1 text-sm text-[#5B6B7F]">
          Route = ordered BMC sequence. Trip = tanker assigned to a route.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-lg border border-[#D7E4FF] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(15,41,74,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5B6B7F]">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold text-[#1E4B6B]">{card.value}</p>
            </div>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-[#DC2626]">{error}</p>}

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <form onSubmit={onCreateTransport} className="rounded-lg border border-[#D7E4FF] bg-white p-4 shadow-[0_8px_18px_rgba(15,41,74,0.08)]">
            <h2 className="text-lg font-semibold text-[#1E4B6B]">Create Transport Company</h2>
            <p className="mt-1 text-xs text-[#5B6B7F]">
              Example: ID {sampleValues.transportId}, Name {sampleValues.transportName}, Phone {sampleValues.transportPhone}
            </p>
            <div className="mt-3 space-y-2">
              <input
                required
                value={transportForm.transportId}
                onChange={(e) => setTransportForm((prev) => ({ ...prev, transportId: e.target.value }))}
                placeholder={`Transport ID (e.g., ${sampleValues.transportId})`}
                className="w-full rounded border border-[#D1D5DB] px-3 py-2 text-sm"
              />
              <input
                required
                value={transportForm.name}
                onChange={(e) => setTransportForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={`Transport Name (e.g., ${sampleValues.transportName})`}
                className="w-full rounded border border-[#D1D5DB] px-3 py-2 text-sm"
              />
              <input
                required
                value={transportForm.phone}
                onChange={(e) =>
                  setTransportForm((prev) => ({
                    ...prev,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                placeholder={`Phone (e.g., ${sampleValues.transportPhone})`}
                inputMode="numeric"
                minLength={10}
                maxLength={10}
                pattern="[0-9]{10}"
                className="w-full rounded border border-[#D1D5DB] px-3 py-2 text-sm"
              />
            </div>
            <button disabled={saving} className="mt-3 rounded bg-[#1E4B6B] px-4 py-2 text-sm font-semibold text-white">
              {saving ? "Saving..." : "Add Transport Company"}
            </button>
          </form>

          <form onSubmit={onCreateTanker} className="rounded-lg border border-[#D7E4FF] bg-white p-4 shadow-[0_8px_18px_rgba(15,41,74,0.08)]">
            <h2 className="text-lg font-semibold text-[#1E4B6B]">Create Tanker (Vehicle)</h2>
            <p className="mt-1 text-xs text-[#5B6B7F]">
              Example: ID {sampleValues.tankerId}, Plate {sampleValues.tankerPlate}, Capacity {sampleValues.tankerCapacity} liters
            </p>
            <div className="mt-3 space-y-2">
              <input
                required
                value={tankerForm.tankerId}
                onChange={(e) => setTankerForm((prev) => ({ ...prev, tankerId: e.target.value }))}
                placeholder={`Tanker ID (e.g., ${sampleValues.tankerId})`}
                className="w-full rounded border border-[#D1D5DB] px-3 py-2 text-sm"
              />
              <input
                value={tankerForm.plateNo}
                onChange={(e) => setTankerForm((prev) => ({ ...prev, plateNo: e.target.value }))}
                placeholder={`Plate Number (e.g., ${sampleValues.tankerPlate})`}
                className="w-full rounded border border-[#D1D5DB] px-3 py-2 text-sm"
              />
              <input
                required
                type="number"
                min="1"
                value={tankerForm.capacityLiters}
                onChange={(e) => setTankerForm((prev) => ({ ...prev, capacityLiters: e.target.value }))}
                placeholder={`Capacity (Liters, e.g., ${sampleValues.tankerCapacity})`}
                className="w-full rounded border border-[#D1D5DB] px-3 py-2 text-sm"
              />
              <select
                value={tankerForm.transportId}
                onChange={(e) => setTankerForm((prev) => ({ ...prev, transportId: e.target.value }))}
                className="w-full rounded border border-[#D1D5DB] px-3 py-2 text-sm"
              >
                <option value="">Select Transport (optional)</option>
                {transports.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.transportId} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <button disabled={saving} className="mt-3 rounded bg-[#1E4B6B] px-4 py-2 text-sm font-semibold text-white">
              {saving ? "Saving..." : "Add Tanker"}
            </button>
          </form>

          <form onSubmit={onCreateRoute} className="rounded-lg border border-[#D7E4FF] bg-white p-4 shadow-[0_8px_18px_rgba(15,41,74,0.08)]">
            <h2 className="text-lg font-semibold text-[#1E4B6B]">Create Trip (Tanker + Route)</h2>
            <p className="mt-1 text-xs text-[#5B6B7F]">Build a route from an ordered BMC sequence, then assign the tanker that will execute it.</p>
            <p className="mt-1 text-xs text-[#5B6B7F]">
              Example: Route {sampleValues.routeCode}, Name {sampleValues.routeName}, select at least one BMC and tanker.
            </p>
            <div className="mt-4 space-y-2">
              <div className="rounded border border-[#E5E7EB] bg-[#F3F4F6] p-2">
                <p className="text-xs font-semibold text-[#4B5563]">Route Details</p>
              </div>
              <input
                required
                value={tripForm.routeCode}
                onChange={(e) => setTripForm((prev) => ({ ...prev, routeCode: e.target.value }))}
                placeholder={`Route Code (e.g., ${sampleValues.routeCode})`}
                className="w-full rounded border border-[#D1D5DB] px-3 py-2 text-sm"
              />
              <input
                required
                value={tripForm.routeName}
                onChange={(e) => setTripForm((prev) => ({ ...prev, routeName: e.target.value }))}
                placeholder={`Route Name (e.g., ${sampleValues.routeName})`}
                className="w-full rounded border border-[#D1D5DB] px-3 py-2 text-sm"
              />
              <div className="rounded border border-[#D1D5DB] p-2">
                <p className="mb-2 text-xs font-semibold text-[#5B6B7F]">Select BMCs in Sequence</p>
                <div className="flex gap-2">
                  <select
                    value={selectedBmc}
                    onChange={(e) => setSelectedBmc(e.target.value)}
                    className="w-full rounded border border-[#D1D5DB] px-3 py-2 text-sm"
                  >
                    <option value="">Select BMC</option>
                    {orderedBmcs.map((bmc) => (
                      <option key={bmc} value={bmc}>
                        {bmc}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addBmcToSequence}
                    disabled={!selectedBmc}
                    className="rounded bg-[#1E4B6B] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                {!orderedBmcs.length && <p className="mt-2 text-xs text-[#9CA3AF]">No BMC records found.</p>}
                {!!tripForm.bmcIds.length && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tripForm.bmcIds.map((bmc, idx) => (
                      <button
                        key={bmc}
                        type="button"
                        onClick={() => removeBmcFromSequence(bmc)}
                        className="inline-flex items-center rounded-full bg-[#E0E7FF] px-2 py-1 text-xs font-semibold text-[#1E4B6B]"
                        title="Remove from sequence"
                      >
                        {idx + 1}. {normalizeBmcLabel(bmc)} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded border border-[#E5E7EB] bg-[#F3F4F6] p-2">
                <p className="text-xs font-semibold text-[#4B5563]">Tanker Assignment</p>
              </div>
              <select
                required
                value={tripForm.tankerId}
                onChange={(e) => setTripForm((prev) => ({ ...prev, tankerId: e.target.value }))}
                className="w-full rounded border border-[#D1D5DB] px-3 py-2 text-sm font-semibold text-[#1E4B6B]"
              >
                <option value="">Select Tanker (Vehicle)</option>
                {tankers.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.tankerId} ({item.capacityLiters}L) - {item.plateNo}
                  </option>
                ))}
              </select>
              <select
                value={tripForm.transportId}
                onChange={(e) => setTripForm((prev) => ({ ...prev, transportId: e.target.value }))}
                className="w-full rounded border border-[#D1D5DB] px-3 py-2 text-sm"
              >
                <option value="">Select Transport Company (optional legacy field)</option>
                {transports.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.transportId} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <button disabled={saving || tripForm.bmcIds.length === 0 || !tripForm.tankerId} className="mt-4 rounded bg-[#1E4B6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? "Creating..." : "Create Trip"}
            </button>
          </form>
        </div>

        <section className="mt-5 rounded-lg border border-[#D7E4FF] bg-white p-4 shadow-[0_8px_18px_rgba(15,41,74,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1E4B6B]">Active Trips</h2>
              <p className="mt-1 text-xs text-[#5B6B7F]">Each trip shows the tanker, transport, and ordered BMC sequence that make up the route.</p>
            </div>
            <form onSubmit={onApplySearch} className="w-full sm:w-[420px]">
              <div className="flex w-full items-center gap-2">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Tanker Trip ID / Tanker ID / BMC / Transport"
                  className="w-full rounded border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1F2937] placeholder:text-[#9CA3AF]"
                />
                <button
                  type="submit"
                  className="rounded bg-[#1E4B6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173A55]"
                >
                  View
                </button>
              </div>
            </form>
          </div>
          {loading ? (
            <p className="mt-2 text-sm text-[#5B6B7F]">Loading...</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#EEF4FF] text-[#1E4B6B]">
                  <tr>
                    <th className="px-3 py-2">Trip ID</th>
                    <th className="px-3 py-2">Route (BMC Sequence)</th>
                    <th className="px-3 py-2">Tanker</th>
                    <th className="px-3 py-2">Transport</th>
                    <th className="px-3 py-2">BMCs Visited</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.length
                    ? renderTripRows(routes)
                    : (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-[#6B7280]">No trips created yet. Create a trip by assigning a tanker to a route.</td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {normalizedSearchQuery && !loading && (
          <section className="mt-5 rounded-lg border border-[#D7E4FF] bg-white p-4 shadow-[0_8px_18px_rgba(15,41,74,0.08)]">
            <h2 className="text-lg font-semibold text-[#1E4B6B]">Filtered Results</h2>
            <p className="mt-1 text-xs text-[#5B6B7F]">Search results for: "{appliedSearchQuery}"</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#EEF4FF] text-[#1E4B6B]">
                  <tr>
                    <th className="px-3 py-2">Trip ID</th>
                    <th className="px-3 py-2">Route (BMC Sequence)</th>
                    <th className="px-3 py-2">Tanker</th>
                    <th className="px-3 py-2">Transport</th>
                    <th className="px-3 py-2">BMCs Visited</th>
                  </tr>
                </thead>
                <tbody>{renderTripRows(filteredRoutes)}</tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
