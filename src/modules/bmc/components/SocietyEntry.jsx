const MILK_TYPES = ["Cow", "Buffalo"];

export default function VerificationTable({ entries, enabled, onChange }) {
  return (
    <div className="bg-white rounded border shadow">
      <div className="grid grid-cols-6 gap-2 bg-gray-200 p-2 text-sm font-semibold border-b">
        <div>Milk Type</div>
        <div>FAT %</div>
        <div>SNF %</div>
        <div>Quantity (L)</div>
        <div>Rate (₹)</div>
        <div>Amount (₹)</div>
      </div>

      {entries.map((entry, i) => (
        <div
          key={i}
          className="grid grid-cols-6 gap-2 p-2 border-b items-center"
        >
          {enabled ? (
            <select
              value={entry.milkType}
              onChange={(e) => onChange(i, "milkType", e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">Select</option>
              {MILK_TYPES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <div>{entry.milkType}</div>
          )}

          {["fat", "snf", "qty"].map((field) =>
            enabled ? (
              <input
                key={field}
                type="number"
                step="0.1"
                value={entry[field]}
                onChange={(e) => onChange(i, field, e.target.value)}
                className="border rounded px-2 py-1"
              />
            ) : (
              <div key={field}>{entry[field]}</div>
            )
          )}

          <div className="text-gray-600">{entry.rate}</div>
          <div className="font-semibold">{entry.amount}</div>
        </div>
      ))}
    </div>
  );
}