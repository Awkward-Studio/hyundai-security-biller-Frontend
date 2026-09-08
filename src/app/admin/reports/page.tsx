"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import loader from "../../../../public/assets/t3-loader.gif";
import PrimaryButton from "@/components/PrimaryButton";
import { Button } from "@/components/ui/button";
import { getReportsData, getLocations, LocationRecord, TempCarRecord } from "@/lib/api";
import { Download, FileSpreadsheet, Filter } from "lucide-react";


export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<LocationRecord[]>([]);

  const [reportType, setReportType] = useState("current_in");
  const [locationId, setLocationId] = useState("");
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    (async () => {
      try {
        const res = await getLocations();
        setLocations(res.documents || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const downloadReport = async (format: "csv" | "xls") => {
    setLoading(true);
    try {
      const res = await getReportsData({
        reportType,
        locationId: locationId || undefined,
        from: reportType === "gate_in_date" || reportType === "gate_out_date" || reportType === "date_range" ? fromDate : undefined,
        to: reportType === "date_range" ? toDate : undefined,
        month: reportType === "monthly" ? month : undefined,
      });

      const docs = res.documents || [];
      if (docs.length === 0) {
        alert("No vehicle records found for the selected report filters.");
        return;
      }

      const headers = [
        "S.No",
        "Vehicle Number",
        "Model",
        "Service Type",
        "Location",
        "Status",
        "Gate-In Date",
        "Gate-In Time",
        "Cashier Clearance Date",
        "Cashier Clearance Time",
        "Delivery By",
        "Driver Name",
        "Gate-Out Date",
        "Gate-Out Time",
        "Exit Type",
      ];

      const rows = docs.map((d: TempCarRecord, i: number) => {
        const inDT = d.entryTime ? new Date(d.entryTime) : null;
        const clDT = d.clearanceTime ? new Date(d.clearanceTime) : null;
        const outDT = d.exitTime ? new Date(d.exitTime) : null;

        return [
          i + 1,
          `"${d.carNumber}"`,
          `"${d.carModel || ""}"`,
          `"${d.serviceType || ""}"`,
          `"${d.location || ""}"`,
          `"${d.carStatus || ""}"`,
          inDT ? inDT.toLocaleDateString("en-IN") : "",
          inDT ? inDT.toLocaleTimeString("en-IN") : "",
          clDT ? clDT.toLocaleDateString("en-IN") : "",
          clDT ? clDT.toLocaleTimeString("en-IN") : "",
          `"${d.deliveryBy || ""}"`,
          `"${d.driverName || ""}"`,
          outDT ? outDT.toLocaleDateString("en-IN") : "",
          outDT ? outDT.toLocaleTimeString("en-IN") : "",
          `"${d.exitType || ""}"`,
        ];
      });

      const csvContent =
        "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `Hyundai_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert(e.message || "Failed to download report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl px-6 py-8">
        {loading && (
          <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm grid place-items-center">
            <Image src={loader} width={120} height={120} alt="Loading..." priority />
          </div>
        )}

        <div className="max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-blue-900" /> Executive Vehicle Reports
            </h1>
            <p className="text-sm text-slate-500">
              Generate detailed XLS / CSV operational reports across all dealership locations.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-6">
            {/* Report Type */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-600 mb-2 block">
                Select Report Type *
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-800"
              >
                <option value="current_in">🚗 Current In-Vehicles (In Facility Now)</option>
                <option value="gate_in_date">📅 By Gate-In Date</option>
                <option value="gate_out_date">🚪 By Gate-Out Date</option>
                <option value="date_range">🗓️ Date Range Report</option>
                <option value="monthly">📊 Monthly Report</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-600 mb-2 block">
                Location Filter
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-800"
              >
                <option value="">All Dealership Locations (Global)</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filters based on Report Type */}
            {(reportType === "gate_in_date" || reportType === "gate_out_date") && (
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 mb-2 block">Target Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            )}

            {reportType === "date_range" && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 mb-2 block">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 mb-2 block">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            {reportType === "monthly" && (
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 mb-2 block">Select Month</label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t flex flex-wrap gap-4 justify-end">
              <Button
                onClick={() => downloadReport("csv")}
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-6 py-3 flex items-center gap-2"
              >
                <Download size={18} /> Export CSV Report
              </Button>
              <Button
                onClick={() => downloadReport("xls")}
                className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-6 py-3 flex items-center gap-2"
              >
                <Download size={18} /> Export XLS Report
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
}
