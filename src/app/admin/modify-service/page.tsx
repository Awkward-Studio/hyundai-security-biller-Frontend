"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { getAllActiveTempCars, getServiceTypes, modifyServiceType, TempCarRecord, ServiceTypeRecord, CarStatus } from "@/lib/api";
import { SlidersHorizontal, Edit, RefreshCw } from "lucide-react";

export default function ModifyServicePage() {
  const [vehicles, setVehicles] = useState<TempCarRecord[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState<TempCarRecord | null>(null);
  const [selectedService, setSelectedService] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [vRes, sRes] = await Promise.all([
        getAllActiveTempCars([CarStatus.ENTERED]),
        getServiceTypes(),
      ]);
      setVehicles(vRes.documents || []);
      setServiceTypes((sRes.documents || []).filter((s) => s.active ?? s.isActive ?? true));
    } catch (err: any) {
      setError(err.message || "Failed to load active vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEdit = (veh: TempCarRecord) => {
    setEditingVehicle(veh);
    setSelectedService(veh.serviceType || "");
    setError("");
    setSuccess("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle || !selectedService) {
      setError("Please select a valid service type.");
      return;
    }
    try {
      setUpdating(true);
      setError("");
      await modifyServiceType(editingVehicle.id || editingVehicle.$id!, selectedService);
      setSuccess(`Service type for ${editingVehicle.carNumber} updated to "${selectedService}".`);
      setEditingVehicle(null);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update service type.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar home="/admin" />
      <div className="flex-1 p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <SlidersHorizontal className="text-blue-900" /> Modify Service Type
            </h1>
            <p className="text-sm text-slate-500">
              Reception / Admin portal to view active in-workshop vehicles and update service categories before cashier clearance.
            </p>
          </div>
          <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
            <RefreshCw size={16} /> Refresh List
          </Button>
        </div>

        {success && (
          <div className="p-4 mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold">
            ✅ {success}
          </div>
        )}
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-semibold">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading active in-workshop vehicles...</div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 uppercase text-xs text-slate-600 border-b">
                <tr>
                  <th className="px-6 py-3">Vehicle Number</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Current Service Type</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Entry Time</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No in-workshop vehicles awaiting service type modification.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((veh) => (
                    <tr key={veh.id || veh.$id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-bold text-blue-900">{veh.carNumber}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{veh.carMake} {veh.carModel}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold">
                          {veh.serviceType || "Unassigned"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{veh.location || "Default Location"}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {veh.entryTime ? new Date(veh.entryTime).toLocaleString() : veh.$createdAt ? new Date(veh.$createdAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => openEdit(veh)} className="text-blue-900 border-blue-200 hover:bg-blue-50">
                          <Edit size={14} className="mr-1" /> Update Service
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {editingVehicle && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Modify Service Type</h2>
              <p className="text-xs text-slate-500 mb-4 font-mono">
                Vehicle: <span className="font-bold text-blue-900">{editingVehicle.carNumber}</span> ({editingVehicle.carModel})
              </p>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Select New Service Type *</label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded p-2.5 text-sm bg-white font-semibold text-slate-800"
                    required
                  >
                    <option value="">-- Choose Service Category --</option>
                    {serviceTypes.map((st) => (
                      <option key={st.id} value={st.name}>
                        {st.name} {st.bodyshopOnly ? "(Bodyshop Only)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-slate-50 rounded text-xs text-slate-600">
                  ℹ️ Updating this field will automatically append an audit log entry to this vehicle record.
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setEditingVehicle(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updating} className="bg-blue-900 hover:bg-blue-800 text-white">
                    {updating ? "Saving..." : "Save Service Type"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
