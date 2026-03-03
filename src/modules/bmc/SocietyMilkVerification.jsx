import { useCallback, useEffect, useState } from "react";
import "./SocietyMilkVerification.css";
import EntryTable from "./components/EntryTable";
import NotificationBell from "./components/NotificationBell";
import BMCPanel from "./components/BMCPanel";
import SaveModal from "./components/SaveModal";
import {
  SOCIETIES_DATA,
  INITIAL_NOTIFICATIONS,
  BMC_USER,
  calcSession,
  genReport,
  isRowValid,
  emptyRow,
} from "./utils/engine";

function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      let h = n.getHours();
      const m = n.getMinutes();
      const s = n.getSeconds();
      const ap = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      const p = (v) => String(v).padStart(2, "0");
      setTime(`${p(h)}:${p(m)}:${p(s)} ${ap}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")} / ${String(d.getMonth() + 1).padStart(2, "0")} / ${d.getFullYear()}`;
}

export default function MilkVerification() {
  const clock = useClock();
  const dateStr = todayStr();
  const bmcUserName = localStorage.getItem("bmc_name") || BMC_USER.name;

  const [societies, setSocieties] = useState(() => SOCIETIES_DATA.map((s) => ({ ...s })));
  const [selectedSoc, setSelectedSoc] = useState(null);

  const [rows, setRows] = useState([emptyRow(), emptyRow()]);
  const [bmcRows, setBmcRows] = useState([emptyRow(), emptyRow()]);

  const [verifyChoice, setVerifyChoice] = useState(null);

  const [saveModal, setSaveModal] = useState(null);
  const [saveError, setSaveError] = useState("");

  const [notifs, setNotifs] = useState(INITIAL_NOTIFICATIONS);

  const handleSocietyChange = (e) => {
    const name = e.target.value;
    if (!name) {
      setSelectedSoc(null);
      return;
    }
    const soc = societies.find((s) => s.name === name);
    setSelectedSoc({ ...soc });
    setRows([emptyRow(), emptyRow()]);
    setBmcRows([emptyRow(), emptyRow()]);
    setVerifyChoice(null);
    setSaveError("");
  };

  const handleRowChange = useCallback((idx, field, val) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  }, []);

  const handleRowDelete = useCallback((idx) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleAddRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRow()]);
  }, []);

  const handleBmcChange = useCallback((idx, field, val) => {
    setBmcRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  }, []);

  const handleVerify = (choice) => {
    setVerifyChoice(choice);
    if (choice === "yes") setBmcRows([emptyRow(), emptyRow()]);
  };

  const handleSave = () => {
    const validRows = rows.filter(isRowValid).map((r) => ({
      type: r.type,
      fat: parseFloat(r.fat),
      snf: parseFloat(r.snf),
      qty: parseFloat(r.qty),
    }));

    if (!validRows.length) {
      setSaveError("Please fill in at least one complete row before saving.");
      setTimeout(() => setSaveError(""), 4000);
      return;
    }
    if (!verifyChoice) {
      setSaveError("Please select YES or NO for verification before saving.");
      setTimeout(() => setSaveError(""), 4000);
      return;
    }

    const session = calcSession(validRows);

    let bmcEntries = null;
    if (verifyChoice === "no") {
      const validBmc = bmcRows.filter(isRowValid).map((r) => ({
        type: r.type,
        fat: parseFloat(r.fat),
        snf: parseFloat(r.snf),
        qty: parseFloat(r.qty),
      }));
      if (validBmc.length) bmcEntries = validBmc;
    }

    let comparisonStatus = verifyChoice === "yes" ? "VERIFIED" : "-";
    if (verifyChoice === "no" && bmcEntries) {
      const rep = genReport(selectedSoc.name, validRows, bmcEntries);
      comparisonStatus = rep.status;
    }

    const record = {
      society: selectedSoc.name,
      savedAt: new Date().toLocaleString("en-IN"),
      savedBy: bmcUserName,
      verifyChoice: verifyChoice === "yes" ? "YES - Values Match" : "NO - BMC Values Entered",
      entries: session.entries,
      totalQty: session.totalQty,
      totalAmt: session.totalAmtFmt,
      bmcEntries,
      comparisonStatus,
    };

    try {
      const all = JSON.parse(localStorage.getItem("milkVerifications") || "{}");
      all[selectedSoc.name] = record;
      localStorage.setItem("milkVerifications", JSON.stringify(all));
    } catch (_) {
      // ignore storage errors
    }

    setSocieties((prev) =>
      prev.map((s) => (s.name === selectedSoc.name ? { ...s, status: "verified" } : s)),
    );
    setSelectedSoc((prev) => ({ ...prev, status: "verified" }));
    setSaveModal(record);
  };

  const markRead = (id) => setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const dismissNotif = (id) => setNotifs((prev) => prev.filter((n) => n.id !== id));
  const clearAll = () => setNotifs([]);

  const statusClass = selectedSoc?.status === "verified" ? "verified" : "not-verified";
  const statusText = selectedSoc?.status === "verified" ? "Verified" : "Not Verified";

  return (
    <div className="bmc-verify">
      <header className="topbar">
        <div className="topbar-left">
          <span className="page-title">Society Milk Verification</span>
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
          <NotificationBell
            notifs={notifs}
            onMarkRead={markRead}
            onMarkAll={markAllRead}
            onDismiss={dismissNotif}
            onClearAll={clearAll}
          />
        </div>
      </header>

      <div className="content">
        <div className="controls-bar">
          <label htmlFor="society-select">Society</label>
          <div className="society-dropdown-wrap">
            <select
              id="society-select"
              className="society-dropdown"
              value={selectedSoc?.name || ""}
              onChange={handleSocietyChange}
            >
              <option value="">- Select Society -</option>
              {societies.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} - {s.qty} L
                </option>
              ))}
            </select>
          </div>

          {selectedSoc && (
            <div className="society-meta">
              <div className="society-qty-badge">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {selectedSoc.qty} L
              </div>
              <span className={`status-pill ${statusClass}`}>
                <span className="status-dot" />
                {statusText}
              </span>
            </div>
          )}
        </div>

        {selectedSoc ? (
          <div className="section-card">
            <div className="card-header">
              <div className="card-title">
                <span className="card-title-dot" />
                Society Entry - {selectedSoc.name}
              </div>
            </div>

            <EntryTable rows={rows} onChange={handleRowChange} onDelete={handleRowDelete} onAddRow={handleAddRow} />

            <div className="verify-section">
              <div className="verify-label">Do physical values match society entry?</div>
              <div className="verify-options">
                <div
                  className={`verify-option${verifyChoice === "yes" ? " sel-yes" : ""}`}
                  onClick={() => handleVerify("yes")}
                >
                  <div className="radio-circle">{verifyChoice === "yes" && <div className="radio-filled" />}</div>
                  YES - Values Match
                </div>
                <div
                  className={`verify-option${verifyChoice === "no" ? " sel-no" : ""}`}
                  onClick={() => handleVerify("no")}
                >
                  <div className="radio-circle">{verifyChoice === "no" && <div className="radio-filled" />}</div>
                  NO - Enter BMC Values
                </div>
              </div>
            </div>

            {verifyChoice === "no" && (
              <BMCPanel bmcRows={bmcRows} onChange={handleBmcChange} societyRows={rows} societyName={selectedSoc.name} />
            )}

            <div className="save-row">
              {saveError && <span className="save-error">{saveError}</span>}
              <button className="save-btn" onClick={handleSave}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Save Verification
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <svg
              width="48"
              height="48"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.2"
              style={{ opacity: 0.35 }}
            >
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Select a society to begin</div>
            <div style={{ fontSize: 13 }}>Choose a society from the dropdown above</div>
          </div>
        )}
      </div>

      {saveModal && <SaveModal record={saveModal} onClose={() => setSaveModal(null)} />}
    </div>
  );
}
