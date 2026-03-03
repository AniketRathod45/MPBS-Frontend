import { useState } from "react";
import jsPDF from "jspdf";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Tooltip,
} from "recharts";
// import mockDispatchData from "../../api/dispatch";
// import { downloadDispatchPdf } from "../../utils/dispatchPdf";
import dashboardData from "../../api/dashboard.json";
import bmcDashboardData from "../../api/bmcDashboard.json";

const milkShareColors = ["#1E4B6B", "#9DB5CC"];

const { milkProcuredByMonth, milkRejectedByMonth, monthQuality, overheads, societiesVerified, dispatchStatus } =
  bmcDashboardData;

export default function BmcDashboard() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const username = localStorage.getItem("bmc_name") || "Username";
  const avatarLetter = username ? username.charAt(0).toUpperCase() : "";
  const [monthProcured, setMonthProcured] = useState("Dec");
  const [monthRejected, setMonthRejected] = useState("Dec");
  const [monthQualityFilter, setMonthQualityFilter] = useState("Dec");
  const [monthOverheads, setMonthOverheads] = useState("Dec");

  const { summary, milkBreakdown } = dashboardData;
  const totalMilk = milkBreakdown.reduce((sum, item) => sum + item.value, 0);
  const milkShare = milkBreakdown.map((item, index) => ({
    name: item.name,
    value: totalMilk > 0 ? Number(((item.value / totalMilk) * 100).toFixed(2)) : 0,
    color: milkShareColors[index] || "#1E4B6B",
  }));
  const milkProcured = milkProcuredByMonth[monthProcured] || [];
  const milkRejected = milkRejectedByMonth[monthRejected] || [];

  // const handleDownloadDispatchSheet = () => {
  //   downloadDispatchPdf(mockDispatchData);
  // };
  const downloadPdfTable = ({ title, subtitle, headers, rows, filename }) => {
    if (!rows || rows.length === 0) return;
    const pdf = new jsPDF("portrait", "mm", "a4");
    const marginX = 10;
    const pageWidth = 210;
    const usableWidth = pageWidth - marginX * 2;
    const rowHeight = 7;
    const colWidth = Math.floor(usableWidth / headers.length);
    const colWidths = headers.map((_, idx) =>
      idx === headers.length - 1 ? usableWidth - colWidth * (headers.length - 1) : colWidth
    );

    let yPos = 14;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(title, marginX, yPos);
    if (subtitle) {
      yPos += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(subtitle, marginX, yPos);
    }
    yPos += 8;

    const drawRow = (cells, isHeader = false) => {
      let x = marginX;
      pdf.setFont("helvetica", isHeader ? "bold" : "normal");
      pdf.setFontSize(9);
      if (isHeader) {
        pdf.setFillColor(30, 75, 107);
        pdf.setTextColor(255, 255, 255);
      } else {
        pdf.setFillColor(255, 255, 255);
        pdf.setTextColor(0, 0, 0);
      }
      cells.forEach((cell, idx) => {
        pdf.setDrawColor(200, 208, 220);
        pdf.rect(x, yPos, colWidths[idx], rowHeight, isHeader ? "F" : undefined);
        pdf.text(String(cell), x + 1.5, yPos + 4.8);
        x += colWidths[idx];
      });
      yPos += rowHeight;
    };

    drawRow(headers, true);
    rows.forEach((row) => {
      if (yPos + rowHeight > 287) {
        pdf.addPage();
        yPos = 12;
        drawRow(headers, true);
      }
      drawRow(row, false);
    });

    pdf.save(filename);
  };

  return (
    <div className="min-h-full bg-[#F8F6F2] p-6 text-[#1F2A44]">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1E4B6B]">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Dashboard
        </div>
        <div className="flex items-center gap-3 text-xs text-[#1F2A44]">
          {/*
          <button
            onClick={handleDownloadDispatchSheet}
            className="rounded-md bg-[#1E4B6B] px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_6px_rgba(30,75,107,0.25)] hover:bg-[#173A55]"
          >
            Generate Dispatch Sheet
          </button>
          */}
          <span>{username}</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#C9D5E5] bg-white text-[11px] font-semibold text-[#1E4B6B]">
            {avatarLetter}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(31,42,68,0.08)]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-[#E6DDF5] bg-[#F7F2FF] px-4 py-3 shadow-[0_2px_6px_rgba(31,42,68,0.08)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[#E2D5FB] bg-white text-[#1E4B6B]">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="7" height="7" rx="1" />
                <rect x="13" y="4" width="7" height="7" rx="1" />
                <rect x="4" y="13" width="7" height="7" rx="1" />
                <rect x="13" y="13" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div>
              <div className="text-[15px] font-semibold">{summary.type.cow} L</div>
              <div className="text-[12px] font-medium text-[#1E4B6B]">Cow Milk Procured</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-[#D6E4FF] bg-[#F2F6FF] px-4 py-3 shadow-[0_2px_6px_rgba(31,42,68,0.08)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[#C9DAFF] bg-white text-[#1E4B6B]">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 9h16" />
                <path d="M6 9l2-3h8l2 3" />
                <path d="M7 13h10" />
                <path d="M9 13v4M15 13v4" />
              </svg>
            </div>
            <div>
              <div className="text-[15px] font-semibold">{summary.type.buffalo} L</div>
              <div className="text-[12px] font-medium text-[#1E4B6B]">Buffalo Milk Procured</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-[#FFE1C7] bg-[#FFF6EB] px-4 py-3 shadow-[0_2px_6px_rgba(31,42,68,0.08)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[#FFD6B1] bg-white text-[#1E4B6B]">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4" />
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold">
                {societiesVerified.verified} / {societiesVerified.total}
              </div>
              <div className="text-[12px] font-medium text-[#1E4B6B]">Societies Verified</div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#E5E7EB]">
                <div className="h-1.5 w-[70%] rounded-full bg-[#1E4B6B]" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-[#D6E8FF] bg-[#F2F8FF] px-4 py-3 shadow-[0_2px_6px_rgba(31,42,68,0.08)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[#C9DDFF] bg-white text-[#1E4B6B]">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7h12v8H3z" />
                <path d="M15 10h3l3 3v2h-6z" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="18" cy="18" r="2" />
              </svg>
            </div>
            <div>
              <div className="text-[12px] font-semibold">Status :- {dispatchStatus}</div>
              <div className="text-[11px] text-[#1E4B6B]">Last trip on time</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(31,42,68,0.08)]">
          <div className="text-sm font-semibold text-[#1F2A44]">Milk Breakdown</div>
          <div className="mt-3 flex items-center gap-6">
            <div className="h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={milkShare}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {milkShare.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs font-semibold text-[#1F2A44]">
              {milkShare.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name} {entry.value}%
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(31,42,68,0.08)]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#1F2A44]">Milk Procured</div>
            <div className="flex items-center gap-2">
              <select
                value={monthProcured}
                onChange={(e) => setMonthProcured(e.target.value)}
                className="rounded-lg border border-[#D6E0EC] bg-[#F3F6FB] px-3 py-1 text-xs font-semibold text-[#1E4B6B]"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  downloadPdfTable({
                    title: "Milk Procured Report",
                    subtitle: `Month: ${monthProcured}`,
                    headers: ["Society", "Value (L)"],
                    rows: milkProcured.map((entry) => [entry.name, entry.value]),
                    filename: `milk_procured_${monthProcured}.pdf`,
                  })
                }
                className="rounded-md bg-[#1E4B6B] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_2px_6px_rgba(30,75,107,0.25)] hover:bg-[#173A55]"
              >
                Download Report
              </button>
            </div>
          </div>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={milkProcured}>
                <CartesianGrid stroke="#E6ECF3" strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#1E4B6B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#1F2A44]">
            <span className="h-2 w-2 rounded-full bg-[#1E4B6B]" />
            Milk Procured from Societies
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(31,42,68,0.08)]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#1F2A44]">Milk Rejected / Adjusted</div>
            <div className="flex items-center gap-2">
              <select
                value={monthRejected}
                onChange={(e) => setMonthRejected(e.target.value)}
                className="rounded-lg border border-[#D6E0EC] bg-[#F3F6FB] px-3 py-1 text-xs font-semibold text-[#1E4B6B]"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  downloadPdfTable({
                    title: "Milk Rejected / Adjusted Report",
                    subtitle: `Month: ${monthRejected}`,
                    headers: ["Society", "Value (L)"],
                    rows: milkRejected.map((entry) => [entry.name, entry.value]),
                    filename: `milk_rejected_${monthRejected}.pdf`,
                  })
                }
                className="rounded-md bg-[#1E4B6B] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_2px_6px_rgba(30,75,107,0.25)] hover:bg-[#173A55]"
              >
                Download Report
              </button>
            </div>
          </div>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={milkRejected}>
                <CartesianGrid stroke="#E6ECF3" strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#E24C4C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#1F2A44]">
            <span className="h-2 w-2 rounded-full bg-[#E24C4C]" />
            Milk Rejected / Adjusted
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(31,42,68,0.08)]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#1F2A44]">Month Wise Milk Quality</div>
            <div className="flex items-center gap-2">
              <select
                value={monthQualityFilter}
                onChange={(e) => setMonthQualityFilter(e.target.value)}
                className="rounded-lg border border-[#D6E0EC] bg-[#F3F6FB] px-3 py-1 text-xs font-semibold text-[#1E4B6B]"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  downloadPdfTable({
                    title: "Month Wise Milk Quality Report",
                    subtitle: `Month: ${monthQualityFilter}`,
                    headers: ["Month", "Good", "Penalised"],
                    rows: monthQuality
                      .filter((entry) => entry.name === monthQualityFilter)
                      .map((entry) => [entry.name, entry.good, entry.bad]),
                    filename: `milk_quality_${monthQualityFilter}.pdf`,
                  })
                }
                className="rounded-md bg-[#1E4B6B] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_2px_6px_rgba(30,75,107,0.25)] hover:bg-[#173A55]"
              >
                Download Report
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-[#1F2A44]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#1E4B6B]" />
              Good Milk
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E24C4C]" />
              Penalised
            </span>
          </div>
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthQuality}>
                <CartesianGrid stroke="#E6ECF3" strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="good" fill="#1E4B6B" radius={[6, 6, 0, 0]} />
                <Bar dataKey="bad" fill="#E24C4C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_8px_rgba(31,42,68,0.08)]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#1F2A44]">Overheads</div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#1F2A44]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#1E4B6B]" />
                Diesel
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#9DB5CC]" />
                Secretary Incentive
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#E24C4C]" />
                Repair & Maintenance
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <select
              value={monthOverheads}
              onChange={(e) => setMonthOverheads(e.target.value)}
              className="rounded-lg border border-[#D6E0EC] bg-[#F3F6FB] px-3 py-1 text-xs font-semibold text-[#1E4B6B]"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                downloadPdfTable({
                  title: "Overheads Report",
                  subtitle: `Month: ${monthOverheads}`,
                  headers: ["Month", "Diesel", "Secretary", "Repair"],
                  rows: overheads
                    .filter((entry) => entry.name === monthOverheads)
                    .map((entry) => [entry.name, entry.diesel, entry.secretary, entry.repair]),
                  filename: `overheads_${monthOverheads}.pdf`,
                })
              }
              className="rounded-md bg-[#1E4B6B] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_2px_6px_rgba(30,75,107,0.25)] hover:bg-[#173A55]"
            >
              Download Report
            </button>
          </div>
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overheads}>
                <CartesianGrid stroke="#E6ECF3" strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="diesel" stroke="#1E4B6B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="secretary" stroke="#9DB5CC" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="repair" stroke="#E24C4C" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
