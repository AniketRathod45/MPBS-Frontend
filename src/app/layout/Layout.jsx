import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  fetchNotifications,
  markNotificationRead,
} from "../../api/notifications";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const societyName = localStorage.getItem("society_name");

  const handleLogout = () => {
    localStorage.removeItem("society_auth");
    localStorage.removeItem("society_name");
    navigate("/login");
  };

  useEffect(() => {
    async function loadNotifications() {
      const data = await fetchNotifications();
      setNotifications(data);
    }
    loadNotifications();
  }, []);

  useEffect(() => {
    setShowNotif(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, read: true } : n
        )
      );
    }

    if (notif.attachment) {
      window.open(notif.attachment.url, "_blank");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-cyan-800 text-white flex flex-col">
        {/* TOP LOGO */}
        <div className="p-4 font-bold border-b border-cyan-700">
          Dairy Society
        </div>

        {/* NAV */}
        <nav className="flex-1 p-2 space-y-1">
          <NavLink
            to="/"
            end
            className="block px-3 py-2 rounded hover:bg-cyan-700"
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/collection"
            className="block px-3 py-2 rounded hover:bg-cyan-700"
          >
            Milk Collection
          </NavLink>

          <NavLink
            to="/ratesheet"
            className="block px-3 py-2 rounded hover:bg-cyan-700"
          >
            Rate Sheet
          </NavLink>

          <NavLink
            to="/dispatch"
            className="block px-3 py-2 rounded hover:bg-cyan-700"
          >
            Dispatch Sheet
          </NavLink>
        </nav>

        {/* ✅ SIDEBAR FOOTER (AS IN PDF) */}
        <div className="p-4 border-t border-cyan-700 text-sm">
          <div className="text-cyan-200">Logged in as</div>
          <div className="font-semibold">{societyName}</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-4 overflow-auto">
        {/* TOP BAR */}
        <div className="flex items-center mb-4">
          <div className="flex-1">
            {location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                className="text-sm text-cyan-700 hover:underline"
              >
                ← Back
              </button>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4 relative">
            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:underline"
            >
              Logout
            </button>

            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                onClick={() => setShowNotif((p) => !p)}
                className="relative text-xl"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div
                  ref={notifRef}
                  className="absolute right-0 mt-2 w-80 bg-white border rounded shadow z-50"
                >
                  <div className="p-2 text-sm font-semibold border-b">
                    Notifications
                  </div>

                  {notifications.length === 0 && (
                    <div className="p-2 text-sm text-gray-500">
                      No notifications
                    </div>
                  )}

                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-2 text-sm cursor-pointer hover:bg-gray-100 border-b last:border-b-0 ${
                        n.read ? "text-gray-500" : "font-semibold"
                      }`}
                    >
                      <div>{n.message}</div>

                      {n.attachment && (
                        <div className="text-xs text-blue-600 mt-1 underline">
                          📎 {n.attachment.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
