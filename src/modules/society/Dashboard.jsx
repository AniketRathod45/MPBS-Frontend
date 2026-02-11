import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const milkData = [
  { day: "Mon", quantity: 420 },
  { day: "Tue", quantity: 380 },
  { day: "Wed", quantity: 510 },
  { day: "Thu", quantity: 460 },
  { day: "Fri", quantity: 600 },
  { day: "Sat", quantity: 720 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500 text-sm">Today’s Milk Collection</p>
          <p className="text-2xl font-bold">1,245 L</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500 text-sm">Average Fat %</p>
          <p className="text-2xl font-bold">3.8%</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500 text-sm">Active Members</p>
          <p className="text-2xl font-bold">86</p>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white p-4 rounded shadow h-80">
        <p className="font-medium mb-2">Weekly Milk Collection (Litres)</p>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={milkData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="quantity"
              stroke="#0891b2"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
