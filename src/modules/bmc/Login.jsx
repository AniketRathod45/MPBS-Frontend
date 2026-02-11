import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BMCLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mock validation
    if (form.username === "BMC_001" && form.password === "bmc123") {
      localStorage.setItem("bmc_auth", "true");
      localStorage.setItem("bmc_name", "BMC Officer");
      navigate("/bmc/verification");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyan-700">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-8">
        <h1 className="text-xl font-semibold text-center mb-2">
          BMC Login
        </h1>

        <p className="text-sm text-gray-500 text-center mb-6">
          Milk verification access
        </p>

        {error && (
          <p className="text-red-600 text-sm text-center mb-3">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="BMC ID"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />

          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            Login
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-4">
          Demo: BMC_001 / bmc123
        </p>
      </div>
    </div>
  );
}