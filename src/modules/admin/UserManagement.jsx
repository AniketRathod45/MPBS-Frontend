import { useState, useEffect } from "react";
import AddUserModal from "./components/AddUserModal";
import { listUsers, createUser } from "../../utils/api";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listUsers();
      setUsers(res?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userData) => {
    setError("");
    try {
      const role = userData.role === "Other Users" ? "Other" : userData.role;
      await createUser({
        username: userData.username,
        password: userData.password,
        role,
        profile: userData,
      });
      alert("User added successfully");
      setShowModal(false);
      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to add user");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">User Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-[#1E4B6B] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(30,75,107,0.22)] transition hover:bg-[#163A54]"
        >
          Add User
        </button>
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-4 py-2">Sl No.</th>
                <th className="border px-4 py-2">User Name</th>
                <th className="border px-4 py-2">Role</th>
                <th className="border px-4 py-2">Auth Status</th>
                <th className="border px-4 py-2">Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user._id || user.id}>
                  <td className="border px-4 py-2 text-center">{index + 1}</td>
                  <td className="border px-4 py-2">{user.username}</td>
                  <td className="border px-4 py-2">{user.role}</td>
                  <td className="border px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.authStatus === "Approved"
                          ? "bg-green-100 text-green-700"
                          : user.authStatus === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.authStatus}
                    </span>
                  </td>
                  <td className="border px-4 py-2">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddUser}
        />
      )}
    </div>
  );
}
