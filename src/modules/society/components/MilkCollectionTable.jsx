const MILK_TYPES = ["Cow", "Buffalo"];

export default function MilkCollectionTable({
  sessionLabel,   // 👈 NEW PROP: "Morning (M)" / "Evening (E)"
  enabled,
  rows = [],
  onAddRow,
  onRemoveRow,
  onChange,
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB");
  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="p-4 rounded border bg-gray-200">
      {/* HEADER – SESSION + DATE + TIME */}
      <div className="mb-2 text-sm">
        <span className="inline-block mb-1 px-2 py-0.5 bg-cyan-700 text-white rounded text-xs">
          Session: {sessionLabel}
        </span>

        <div>
          <span className="font-bold">Date :</span>{" "}
          <span className="font-bold">{dateStr}</span>
        </div>

        <div>
          <span className="font-bold">Time :</span>{" "}
          <span className="font-bold">{timeStr}</span>
        </div>
      </div>

      {/* COLUMN HEADER */}
      <div className="grid grid-cols-6 gap-2 bg-gray-300 p-2 text-sm font-semibold border border-gray-400">
        <div>Milk Type</div>
        <div>FAT %</div>
        <div>SNF %</div>
        <div>Quantity</div>
        <div>Rate</div>
        <div>Amount</div>
      </div>

      {/* ROWS */}
      {rows.map((row, index) => {
        const otherSelectedTypes = rows
          .filter((_, i) => i !== index)
          .map((r) => r.milkType);

        return (
          <div
            key={index}
            className="grid grid-cols-6 gap-2 bg-gray-100 p-2 mt-1 items-center border border-gray-300"
          >
            <select
              value={row.milkType}
              disabled={!enabled}
              onChange={(e) =>
                onChange(index, "milkType", e.target.value)
              }
              className="border p-1 rounded text-sm disabled:bg-gray-200"
            >
              <option value="">Select</option>
              {MILK_TYPES.map((type) => (
                <option
                  key={type}
                  value={type}
                  disabled={otherSelectedTypes.includes(type)}
                >
                  {type}
                </option>
              ))}
            </select>

            <input
              value={row.fat}
              disabled={!enabled}
              onChange={(e) =>
                onChange(index, "fat", e.target.value)
              }
              className="border p-1 rounded text-sm disabled:bg-gray-200"
            />

            <input
              value={row.snf}
              disabled={!enabled}
              onChange={(e) =>
                onChange(index, "snf", e.target.value)
              }
              className="border p-1 rounded text-sm disabled:bg-gray-200"
            />

            <input
              value={row.qty}
              disabled={!enabled}
              onChange={(e) =>
                onChange(index, "qty", e.target.value)
              }
              className="border p-1 rounded text-sm disabled:bg-gray-200"
            />

            <input
              value={row.rate || ""}
              disabled
              className="border p-1 rounded text-sm bg-gray-200"
            />

            <input
              value={row.amount || ""}
              disabled
              className="border p-1 rounded text-sm bg-gray-200"
            />

           {enabled && rows.length > 1 && (
  <div className="col-span-6 flex justify-end">
    <button
      type="button"
      onClick={() => onRemoveRow(index)
      }
      
      className="text-red-600 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-100"
    >
      Remove
    </button>
  </div>
)}

          </div>
        );
      })}

      {enabled && rows.length < 2 && (
        <button
          onClick={onAddRow}
          className="mt-2 text-blue-700 text-sm"
        >
          + Add Milk Type
        </button>
      )}
    </div>
  );
}
