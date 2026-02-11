import { useEffect, useState } from "react";
import { getSession } from "../../utils/session";
import { fetchRateAndAmount } from "../../api/rateSheet";
import { mockBMCSocieties, markSocietyAsVerified } from "../../mock/bmcMock";
import SocietySelector from "./components/SocietySelector";
import VerificationTable from "./components/SocietyEntry";

export default function MilkVerification() {
  const [session, setSession] = useState(null);
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState(null);
  const [matchStatus, setMatchStatus] = useState(null);
  const [correctionEntries, setCorrectionEntries] = useState([]);
  const [saved, setSaved] = useState(false);

useEffect(() => {
    setSession(getSession());
    setSocieties(mockBMCSocieties);
  }, []);

  if (!session) return null;

  const handleSocietySelect = (society) => {
    if (!society) return;
    setSelectedSociety(society);
    
    if (society.verified) {
      setSaved(true);
      setMatchStatus(society.matchStatus ?? true);
      // Show the entries that were saved (original or corrected)
      setCorrectionEntries(society.entries.map(e => ({ ...e })));
    } else {
      setSaved(false);
      setMatchStatus(null);
      // Pre-fill correction entries with society data
      setCorrectionEntries(society.entries.map((e) => ({ ...e })));
    }
  };

  const handleCorrectionChange = async (index, field, value) => {
    const updated = [...correctionEntries];
    updated[index][field] = value;
    setCorrectionEntries(updated);

    if (["milkType", "fat", "snf", "qty"].includes(field)) {
      const entry = updated[index];
      if (entry.milkType && entry.qty) {
        const { rate, amount } = await fetchRateAndAmount({
          milkType: entry.milkType,
          fat: Number(entry.fat),
          snf: Number(entry.snf),
          qty: Number(entry.qty)
        });
        updated[index].rate = rate;
        updated[index].amount = amount;
        setCorrectionEntries([...updated]);
      }
    }
  };

  const handleSave = () => {
    if (!window.confirm("Cross-check values before saving?")) return;

    // 1. Create updated society object
    const updatedSociety = {
      ...selectedSociety,
      verified: true,
      matchStatus: matchStatus,
      // If "No", use corrected entries. If "Yes", keep original.
      entries: matchStatus === false ? correctionEntries : selectedSociety.entries
    };

    // 2. Update list and active selection
    const updatedList = societies.map(s => s.id === selectedSociety.id ? updatedSociety : s);
    setSocieties(updatedList);
    setSelectedSociety(updatedSociety);
    markSocietyAsVerified(selectedSociety.id);
    setSaved(true);
    alert("Verification saved & locked");
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Society Milk Verification</h1>
        <span className="px-3 py-1 bg-cyan-700 text-white rounded text-sm">
          Session: {session === "M" ? "Morning (M)" : "Evening (E)"}
        </span>
      </div>

      <div className="flex gap-6">
        {/* LEFT: SOCIETY DROPDOWN */}
        <div className="w-64">
           <SocietySelector
            societies={societies}
            selected={selectedSociety}
            onSelect={handleSocietySelect}
          />
        </div>

        {/* RIGHT: VERIFICATION PANEL */}
        {selectedSociety && (
          <div className="flex-1">
            {/* Society Info Header */}
            <div className="bg-white p-4 rounded shadow mb-4 border-l-4 border-cyan-700">
              <h2 className="font-semibold text-lg">{selectedSociety.name}</h2>
              <div className="text-sm text-gray-600 mt-1">
                Session: {selectedSociety.session === "M" ? "Morning" : "Evening"} • 
                Time: {selectedSociety.time} • 
                Date: {new Date(selectedSociety.date).toLocaleDateString()}
              </div>
            </div>

            {/* SECTION A: Society Entry (Read-only) */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-gray-700">
                Section A: Society Entry (Read-only)
              </h3>
              <VerificationTable
                entries={selectedSociety.entries}
                enabled={false}
              />
            </div>

            {!saved && (
              <>
                {/* SECTION B: Physical Verification */}
                <div className="bg-white p-4 rounded shadow mb-4">
                  <p className="font-semibold mb-3">
                    Section B: Do physical values match society entry?
                  </p>

                  <div className="space-x-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="match"
                        checked={matchStatus === true}
                        onChange={() => setMatchStatus(true)}
                        className="mr-2"
                      />
                      <span>Yes</span>
                    </label>

                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="match"
                        checked={matchStatus === false}
                        onChange={() => setMatchStatus(false)}
                        className="mr-2"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {/* SECTION C: Correction Entry (Conditional) */}
                {matchStatus === false && (
                  <div className="mb-4">
                    {/* <h3 className="font-semibold mb-2 text-gray-700">
                      Section C: Correction Entry
                    </h3> */}
                    <VerificationTable
                      entries={correctionEntries}
                      enabled={true}
                      onChange={handleCorrectionChange}
                    />
                  </div>
                )}

                {/* SAVE BUTTON */}
                {matchStatus !== null && (
                  <button
                    onClick={handleSave}
                    className={`px-6 py-2 rounded text-white ${
                      matchStatus === true
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    Save Verification
                  </button>
                )}
              </>
            )}

            {saved && (
              <div className="bg-green-50 border border-green-300 text-green-700 p-4 rounded">
                ✔ Verification completed and locked
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
