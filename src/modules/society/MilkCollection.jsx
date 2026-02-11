import { useEffect, useState } from "react";
import MilkCollectionTable from "./components/MilkCollectionTable";
import { fetchRateAndAmount } from "../../api/rateSheet";
import { getSession } from "../../utils/session";

const createEmptyRow = () => ({
  milkType: "",
  fat: "",
  snf: "",
  qty: "",
  rate: "",
  amount: "",
});

export default function MilkCollection() {
  const [session, setSession] = useState(null);
  const [saved, setSaved] = useState(false);

  const [morningRows, setMorningRows] = useState([createEmptyRow()]);
  const [eveningRows, setEveningRows] = useState([createEmptyRow()]);

  useEffect(() => {
    setSession(getSession()); // "M" or "E"
  }, []);

  if (!session) return null;

  const isMorning = session === "M";

  const handleAddRow = (setRows) =>
    setRows((prev) => [...prev, createEmptyRow()]);

  const handleRemoveRow = (index, setRows) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const handleChange = async (index, field, value, rows, setRows) => {
    const updated = rows.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    );
    setRows(updated);

    if (!["milkType", "fat", "snf", "qty"].includes(field)) return;

    const row = updated[index];
    if (!row.milkType || !row.qty) return;

    const { rate, amount } = await fetchRateAndAmount(row);

    setRows((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, rate, amount } : r
      )
    );
  };

  const activeRows = isMorning ? morningRows : eveningRows;

  const canSave =
    !saved &&
    activeRows.length > 0 &&
    activeRows.every(
      (r) =>
        r.milkType &&
        r.fat !== "" &&
        r.snf !== "" &&
        r.qty !== "" &&
        Number(r.qty) > 0
    );

  const handleSave = () => {
    if (!canSave) return;

    const ok = window.confirm(
      "Once saved, this entry cannot be edited without admin approval.\n\nContinue?"
    );
    if (!ok) return;

    console.log("SAVE PAYLOAD", {
      date: new Date().toISOString().split("T")[0],
      session,
      rows: activeRows,
    });

    setSaved(true);
    alert("Milk collection saved");
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Milk Collection</h1>

        <span className="px-3 py-1 bg-cyan-700 text-white rounded text-sm">
          Session: {isMorning ? "Morning (M)" : "Evening (E)"}
        </span>
      </div>

      <MilkCollectionTable
        sessionLabel="Morning (M)"
        enabled={isMorning && !saved}
        rows={morningRows}
        onAddRow={() => handleAddRow(setMorningRows)}
        onRemoveRow={(i) => handleRemoveRow(i, setMorningRows)}
        onChange={(i, f, v) =>
          handleChange(i, f, v, morningRows, setMorningRows)
        }
      />

      <div className="my-6" />

      <MilkCollectionTable
        sessionLabel="Evening (E)"
        enabled={!isMorning && !saved}
        rows={eveningRows}
        onAddRow={() => handleAddRow(setEveningRows)}
        onRemoveRow={(i) => handleRemoveRow(i, setEveningRows)}
        onChange={(i, f, v) =>
          handleChange(i, f, v, eveningRows, setEveningRows)
        }
      />

      <button
        onClick={handleSave}
        disabled={!canSave}
        className={`mt-6 px-6 py-2 rounded text-white ${
          canSave
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {saved ? "Saved (Locked)" : "Save"}
      </button>
    </div>
  );
}
