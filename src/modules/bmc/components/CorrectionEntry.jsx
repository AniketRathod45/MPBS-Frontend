import { useState } from "react";

export default function CorrectionEntry({ base, onSave }) {
  const [form, setForm] = useState({ ...base });

  const amount = form.qty * form.rate;

  return (
    <div className="bg-white p-4 border rounded">
      <h3 className="font-semibold mb-2">Correction Entry</h3>

      {["milkType", "fat", "snf", "qty"].map(f => (
        <input
          key={f}
          value={form[f]}
          onChange={e =>
            setForm({ ...form, [f]: e.target.value })
          }
          className="border p-2 mr-2 mb-2"
          placeholder={f}
        />
      ))}

      <p>Amount: ₹{amount}</p>

      <button
        onClick={() => onSave({ ...form, amount })}
        className="mt-3 px-6 py-2 bg-blue-600 text-white rounded"
      >
        Save
      </button>
    </div>
  );
}
