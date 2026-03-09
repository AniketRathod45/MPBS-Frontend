import { useState, useEffect } from "react";
import { listRequests, updateRequest } from "../../utils/api";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await listRequests();
      setRequests(res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reqId) => {
    if (!confirm("Approve this request?")) return;
    await updateRequest(reqId, { status: "approved" });
    alert("Request approved");
    loadRequests();
  };

  const handleReject = async (reqId) => {
    if (!confirm("Reject this request?")) return;
    await updateRequest(reqId, { status: "rejected" });
    alert("Request rejected");
    loadRequests();
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Requests</h1>

      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">No requests found</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id || req.id}
              className="bg-white p-4 rounded shadow border-l-4 border-cyan-700"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{req.username || req.userId || "User"}</p>
                  <p className="text-sm text-gray-600">
                    Role: {req.role || "N/A"} - Type: {req.type}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(req.createdAt || req.requestedAt || Date.now()).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    req.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : req.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {req.status}
                </span>
              </div>

              {req.message && <p className="text-sm mb-3">{req.message}</p>}

              {req.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(req._id || req.id)}
                    className="px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(req._id || req.id)}
                    className="px-4 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
