"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { getAllTempCars, getDrivers, approveCashierClearance, TempCarRecord, DriverRecord, CarStatus } from "@/lib/api";
import { Receipt, CheckCircle, Car } from "lucide-react";

export default function CashierClearancePage() {
  const [cars, setCars] = useState<TempCarRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<TempCarRecord | null>(null);

  const [deliveryBy, setDeliveryBy] = useState("By Customer Self");
  const [driverId, setDriverId] = useState("");
  const [otherDriverName, setOtherDriverName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, dRes] = await Promise.all([getAllTempCars(), getDrivers()]);
      const pending = (vRes.documents || []).filter(
        (c) => c.carStatus === CarStatus.ENTERED || c.carStatus === CarStatus.GATEPASS_GENERATED
      );
      setCars(pending);
      setDrivers((dRes.documents || []).filter((d) => d.active ?? d.isActive));
    } catch (err) {
      console.error("Failed to load cashier data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openClearanceModal = (car: TempCarRecord) => {
    setSelectedCar(car);
    setDeliveryBy("By Customer Self");
    setDriverId("");
    setOtherDriverName("");
    setRemarks("");
    setError("");
    setSuccess("");
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar || !selectedCar.id) return;

    let finalDriverName = "";
    if (deliveryBy === "Drop By Driver") {
      if (!driverId) {
        setError("Please select a driver.");
        return;
      }
      const drv = drivers.find((d) => d.id === driverId);
      finalDriverName = drv ? drv.name : "";
    } else if (deliveryBy === "Other") {
      finalDriverName = otherDriverName.trim() || "Other Delivery";
    } else {
      finalDriverName = "Customer Self";
    }

    try {
      await approveCashierClearance(selectedCar.id, {
        deliveryBy,
        driverId: deliveryBy === "Drop By Driver" ? driverId : null,
        driverName: finalDriverName,
        clearanceRemarks: remarks,
      });

      setSuccess(`Vehicle ${selectedCar.carNumber} cleared successfully for delivery.`);
      setSelectedCar(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Clearance failed");
    }
  };

  return (
    <div className="flex flex-row min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="text-blue-900" /> Cashier Clearance & Delivery Setup
          </h1>
          <p className="text-sm text-slate-500">
            Approve vehicle release and record delivery assignment (Driver / Customer Self / Other).
          </p>
        </div>

        {success && (
          <div className="p-4 mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
            <CheckCircle size={18} /> {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading pending clearance vehicles...</div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 uppercase text-xs text-slate-600 border-b">
                <tr>
                  <th className="px-6 py-3">Vehicle No</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Service Type</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Gate In Time</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cars.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No vehicles currently awaiting cashier clearance.
                    </td>
                  </tr>
                ) : (
                  cars.map((car) => (
                    <tr key={car.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">{car.carNumber}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{car.carModel}</td>
                      <td className="px-6 py-4">{car.serviceType || "—"}</td>
                      <td className="px-6 py-4 font-semibold text-blue-900">{car.location || "—"}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {car.entryTime ? new Date(car.entryTime).toLocaleString("en-IN") : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => openClearanceModal(car)}
                          className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs"
                        >
                          Approve Clearance
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedCar && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Approve Cashier Clearance</h2>
              <div className="p-3 mb-4 bg-slate-50 border rounded text-xs">
                <div className="font-mono font-bold text-slate-800 text-sm">{selectedCar.carNumber}</div>
                <div className="text-slate-600">{selectedCar.carModel} • {selectedCar.serviceType || "General Service"}</div>
              </div>

              {error && <div className="p-3 mb-4 bg-red-50 text-red-700 rounded text-xs">{error}</div>}

              <form onSubmit={handleApprove} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Delivery By *</label>
                  <select
                    value={deliveryBy}
                    onChange={(e) => setDeliveryBy(e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded p-2 text-sm bg-white"
                  >
                    <option value="By Customer Self">🙋 By Customer Self</option>
                    <option value="Drop By Driver">🚗 Drop By Driver</option>
                    <option value="Other">📝 Other Delivery</option>
                  </select>
                </div>

                {deliveryBy === "Drop By Driver" && (
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">Select Driver *</label>
                    <select
                      value={driverId}
                      onChange={(e) => setDriverId(e.target.value)}
                      className="w-full mt-1 border border-slate-300 rounded p-2 text-sm bg-white"
                    >
                      <option value="">-- Select Driver --</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.locationName ? `(${d.locationName})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {deliveryBy === "Other" && (
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">Specify Person / Tow Truck</label>
                    <input
                      type="text"
                      placeholder="e.g. Sales Exec / Insurance Agent"
                      value={otherDriverName}
                      onChange={(e) => setOtherDriverName(e.target.value)}
                      className="w-full mt-1 border border-slate-300 rounded p-2 text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Clearance Remarks</label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional delivery notes..."
                    className="w-full mt-1 border border-slate-300 rounded p-2 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setSelectedCar(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-700 hover:bg-emerald-600 text-white">
                    Approve Clearance
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
