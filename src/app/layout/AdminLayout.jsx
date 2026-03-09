import { Outlet, NavLink, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    navigate("/admin/login");
  };

  const navItems = [
    { label: "User Management", to: "/admin/users", icon: "users" },
    { label: "Requests", to: "/admin/requests", icon: "requests" },
    { label: "Notifications", to: "/admin/notifications", icon: "notifications" },
  ];

  const iconMap = {
    users: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0v2H2v-2Zm13 0a5 5 0 0 1 10 0v2H15v-2Z"
        />
      </svg>
    ),
    requests: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5L14 3.5ZM8 12h10v2H8v-2Zm0 4h10v2H8v-2Zm0-8h6v2H8V8Z"
        />
      </svg>
    ),
    notifications: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z"
        />
      </svg>
    ),
  };

  return (
    <div className="flex h-screen bg-[#F8F6F2] select-none cursor-default">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white text-[#1F2A44] flex flex-col border-r border-[#E5E7EB]">
        <div className="px-5 pt-6 pb-4 border-b border-[#E5E7EB] text-center">
          <img
            src="/logo1.png"
            alt="Admin Logo"
            className="mx-auto h-16 w-auto"
          />
          <div className="mt-2 text-sm font-semibold tracking-wide text-[#1F2A44]">
            Admin Panel
          </div>
        </div>

        <nav className="flex-1 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm border-b border-[#E5E7EB] transition-colors ${
                  isActive
                    ? "bg-[#1E4B6B] text-white"
                    : "text-[#1F2A44] hover:bg-[#F1F5F9]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#E9EEF5] text-[#1E4B6B]"
                    }`}
                  >
                    {iconMap[item.icon]}
                  </span>
                  <span className="font-semibold leading-snug">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-[#E5E7EB] text-xs">
          <div className="text-[#6B7280]">Logged in as</div>
          <div className="font-semibold text-[#1F2A44]">Admin</div>
          <button
            onClick={handleLogout}
            className="mt-3 text-xs font-semibold text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-auto bg-[#F8F6F2]">
        <Outlet />
      </main>
    </div>
  );
}
