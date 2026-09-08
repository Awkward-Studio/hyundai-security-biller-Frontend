"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { getAllTempCars, getLocations, transferVehicle, TempCarRecord, LocationRecord, CarStatus } from "@/lib/api";
import { ArrowLeftRight, CheckCircle, MapPin } from "lucide-react";

export default function VehicleTransferPage() {
  const [cars, setCars] = useState<TempCarRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCar, setSelectedCar] = useState<TempCarRecord | null>(null);
  const [destLocationId, setDestLocationId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, lRes] = await Promise.all([getAllTempCars(), getLocations()]);
      const active = (vRes.documents || []).filter(
        (c) => c.carStatus === CarStatus.ENTERED || c.carStatus === CarStatus.GATEPASS_GENERATED
      );
      setCars(active);
      setLocations((lRes.documents || []).filter((l) => l.active ?? l.isActive));
    } catch (err) {
      console.error("Failed to load transfer data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openTransferModal = (car: TempCarRecord) => {
    setSelectedCar(car);
    setDestLocationId("");
    setError("");
    setSuccess("");
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar || !selectedCar.id) return;
    if (!destLocationId) {
      setError("Please select a destination location.");
      return;
    }

    try {
      await transferVehicle(selectedCar.id, destLocationId);
      const destLoc = locations.find((l) => l.id === destLocationId);
      setSuccess(`Vehicle ${selectedCar.carNumber} transferred successfully to ${destLoc?.name || "destination"}.`);
      setSelectedCar(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Transfer failed");
    }
  };

  return (
    <div className="flex flex-row min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ArrowLeftRight className="text-blue-900" /> Vehicle Transfer Module
          </h1>
          <p className="text-sm text-slate-500">
            Transfer in-workshop vehicles between Hyundai locations without requiring cashier approval.
          </p>
        </div>

        {success && (
          <div className="p-4 mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
            <CheckCircle size={18} /> {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading active vehicles...</div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 uppercase text-xs text-slate-600 border-b">
                <tr>
                  <th className="px-6 py-3">Vehicle No</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Current Location</th>
                  <th className="px-6 py-3">Service Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cars.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No active in-workshop vehicles available for transfer.
                    </td>
                  </tr>
                ) : (
                  cars.map((car) => (
                    <tr key={car.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">{car.carNumber}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{car.carModel}</td>
                      <td className="px-6 py-4 font-semibold text-blue-900 flex items-center gap-1">
                        <MapPin size={14} /> {car.location || "—"}
                      </td>
                      <td className="px-6 py-4">{car.serviceType || "—"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                          In Workshop
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => openTransferModal(car)}
                          className="bg-blue-900 hover:bg-blue-800 text-white text-xs"
                        >
                          Transfer Location
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
              <h2 className="text-xl font-bold text-slate-800 mb-2">Transfer Vehicle Location</h2>
              <div className="p-3 mb-4 bg-slate-50 border rounded text-xs">
                <div className="font-mono font-bold text-slate-800 text-sm">{selectedCar.carNumber}</div>
                <div className="text-slate-600">Current Location: <b>{selectedCar.location || "Unknown"}</b></div>
              </div>

              {error && <div className="p-3 mb-4 bg-red-50 text-red-700 rounded text-xs">{error}</div>}

              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Destination Location *</label>
                  <select
                    value={destLocationId}
                    onChange={(e) => setDestLocationId(e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded p-2 text-sm bg-white"
                  >
                    <option value="">-- Select Destination Location --</option>
                    {locations
                      .filter((l) => l.id !== selectedCar.locationId && l.name !== selectedCar.location)
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 text-xs text-blue-900 rounded">
                  <b>Self-Authorized Gate Out:</b> Transferring completes the current location entry and automatically creates a new Gate-In entry at the destination location.
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setSelectedCar(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white">
                    Confirm Transfer
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
