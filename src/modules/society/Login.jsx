import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SocietyLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // TEMP DUMMY AUTH (backend later)
    const VALID_USERNAME = "SOCIETY_001";
    const VALID_PASSWORD = "password123";

    if (
      form.username === VALID_USERNAME &&
      form.password === VALID_PASSWORD
    ) {
      localStorage.setItem("society_auth", "true");

      // ✅ STORE WHATEVER SOCIETY LOGS IN
      localStorage.setItem("society_name", form.username);

      navigate("/");
    } else {
      alert("Invalid Username or Password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyan-700">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-8">
        <h1 className="text-xl font-semibold text-center mb-2">
          Society / DCS Login
        </h1>

        <p className="text-sm text-gray-500 text-center mb-6">
          Login to manage daily dairy operations
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Society Code / Username"
            value={form.username}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-600"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-600"
          />

          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
