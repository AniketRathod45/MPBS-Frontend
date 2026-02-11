export default function SocietySelector({ societies, selected, onSelect }) {
  return (
    <div className="w-72 bg-white p-4 rounded shadow border">
      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
        Select Society
      </label>
      <select 
        className="w-full p-2 border-2 border-cyan-700 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
        value={selected?.id || ""}
        onChange={(e) => {
          const soc = societies.find(s => s.id === e.target.value);
          onSelect(soc);
        }}
      >
        <option value="" disabled>-- Select a Society --</option>
        {societies.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} {s.verified ? " (Verified ✔)" : " (Pending ⏳)"}
          </option>
        ))}
      </select>
    </div>
  );
}