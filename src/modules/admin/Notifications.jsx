import { useState } from "react";
import { sendNotification } from "../../api/admin";

const RECIPIENT_OPTIONS = ["Society", "EO", "Dairy", "BMC", "All"];

export default function Notifications() {
  const [sentTo, setSentTo] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!sentTo || !message) {
      alert("Please select recipient and enter message");
      return;
    }

    setLoading(true);

    const attachment = file ? {
      name: file.name,
      url: URL.createObjectURL(file) // Mock URL
    } : null;

    const res = await sendNotification({
      sentTo,
      message,
      attachment
    });

    setLoading(false);

    if (res.success) {
      alert("Notification sent successfully");
      setSentTo("");
      setMessage("");
      setFile(null);
    } else {
      alert(res.message);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Send Notification</h1>

      <div className="bg-white p-6 rounded shadow max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Send To *
            </label>
            <select
              value={sentTo}
              onChange={(e) => setSentTo(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select Recipient</option>
              {RECIPIENT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border rounded px-3 py-2 h-32"
              placeholder="Enter notification message"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Attachment (Optional)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full border rounded px-3 py-2"
            />
            {file && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800 disabled:bg-gray-400"
          >
            {loading ? "Sending..." : "Send Notification"}
          </button>
        </form>
      </div>
    </div>
  );
}