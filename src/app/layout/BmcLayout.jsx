import { Outlet, NavLink, useNavigate } from "react-router-dom";

export default function BMCLayout() {
  const navigate = useNavigate();
  const bmcName = localStorage.getItem("bmc_name");

  const handleLogout = () => {
    localStorage.removeItem("bmc_auth");
    localStorage.removeItem("bmc_name");
    navigate("/bmc/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-cyan-800 text-white flex flex-col">
        <div className="p-4 font-bold border-b border-cyan-700">
          BMC Panel
        </div>

        <nav className="flex-1 p-2 space-y-1">
          <NavLink
            to="/bmc/verification"
            className={({ isActive }) =>
              `block px-3 py-2 rounded ${
                isActive ? "bg-cyan-700" : "hover:bg-cyan-700"
              }`
            }
          >
            Society Milk Verification
          </NavLink>
        </nav>

        <div className="p-4 border-t border-cyan-700 text-sm">
          <div className="text-cyan-200">Logged in as</div>
          <div className="font-semibold">{bmcName}</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-4 overflow-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>

        <Outlet />
      </main>
    </div>
  );
}