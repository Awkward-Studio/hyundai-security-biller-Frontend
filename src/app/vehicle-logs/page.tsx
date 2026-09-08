"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { getAllTempCars, getLocations, TempCarRecord, LocationRecord } from "@/lib/api";
import { FileSpreadsheet, Download, Search, Filter } from "lucide-react";

export default function VehicleLogsPage() {
  const [logs, setLogs] = useState<TempCarRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, lRes] = await Promise.all([getAllTempCars(), getLocations()]);
      setLogs(vRes.documents || []);
      setLocations(lRes.documents || []);
    } catch (err) {
      console.error("Failed to load vehicle logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (search && !log.carNumber.toLowerCase().includes(search.toLowerCase()) && !log.carModel.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter && log.carStatus !== statusFilter) {
      return false;
    }
    if (locationFilter && log.locationId !== locationFilter && log.location !== locationFilter) {
      return false;
    }
    return true;
  });

  const exportCSV = () => {
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

    const rows = filteredLogs.map((l, i) => {
      const inDT = l.entryTime ? new Date(l.entryTime) : null;
      const clDT = l.clearanceTime ? new Date(l.clearanceTime) : null;
      const outDT = l.exitTime ? new Date(l.exitTime) : null;

      return [
        i + 1,
        `"${l.carNumber}"`,
        `"${l.carModel || ""}"`,
        `"${l.serviceType || ""}"`,
        `"${l.location || ""}"`,
        `"${l.carStatus || ""}"`,
        inDT ? inDT.toLocaleDateString("en-IN") : "",
        inDT ? inDT.toLocaleTimeString("en-IN") : "",
        clDT ? clDT.toLocaleDateString("en-IN") : "",
        clDT ? clDT.toLocaleTimeString("en-IN") : "",
        `"${l.deliveryBy || ""}"`,
        `"${l.driverName || ""}"`,
        outDT ? outDT.toLocaleDateString("en-IN") : "",
        outDT ? outDT.toLocaleTimeString("en-IN") : "",
        `"${l.exitType || ""}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Vehicle_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-row min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-blue-900" /> Historical Vehicle Logs
            </h1>
            <p className="text-sm text-slate-500">Comprehensive history of vehicle movements, cashier clearances, and gate exits.</p>
          </div>
          <Button onClick={exportCSV} className="bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-2">
            <Download size={16} /> Export CSV / XLS
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow border border-slate-200 mb-6 grid md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search vehicle number or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-sm"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
            >
              <option value="">All Statuses</option>
              <option value="ENTERED">ENTERED (In Workshop)</option>
              <option value="CLEARED">CLEARED (Cashier Cleared)</option>
              <option value="GATEPASS_GENERATED">GATEPASS GENERATED</option>
              <option value="COMPLETED">COMPLETED (Exited / Transferred)</option>
            </select>
          </div>

          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading vehicle logs...</div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 uppercase text-slate-600 border-b">
                <tr>
                  <th className="px-4 py-3">S.No</th>
                  <th className="px-4 py-3">Vehicle No</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Service Type</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Gate In</th>
                  <th className="px-4 py-3">Clearance / Delivery</th>
                  <th className="px-4 py-3">Gate Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">
                      No matching vehicle logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, i) => (
                    <tr key={log.id || i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 font-semibold">{i + 1}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{log.carNumber}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{log.carModel || "—"}</td>
                      <td className="px-4 py-3">{log.serviceType || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-blue-900">{log.location || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                          {log.carStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {log.entryTime ? new Date(log.entryTime).toLocaleString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {log.clearanceTime ? (
                          <div>
                            <div>{new Date(log.clearanceTime).toLocaleString("en-IN")}</div>
                            <div className="text-[10px] text-emerald-800 font-semibold">
                              {log.deliveryBy} {log.driverName ? `(${log.driverName})` : ""}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {log.exitTime ? (
                          <div>
                            <div>{new Date(log.exitTime).toLocaleString("en-IN")}</div>
                            <div className="text-[10px] text-blue-800 font-semibold">{log.exitType}</div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
