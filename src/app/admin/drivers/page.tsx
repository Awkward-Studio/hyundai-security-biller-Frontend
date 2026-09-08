"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getDrivers, createDriver, updateDriver, deleteDriver, getLocations, DriverRecord, LocationRecord } from "@/lib/api";
import { UserCheck, Plus, Edit, Trash2 } from "lucide-react";

export default function DriverMasterPage() {
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverRecord | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [locationId, setLocationId] = useState<string>("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [dRes, lRes] = await Promise.all([getDrivers(), getLocations()]);
      setDrivers(dRes.documents || []);
      setLocations(lRes.documents || []);
    } catch (err: any) {
      setError(err.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingDriver(null);
    setName("");
    setPhone("");
    setLocationId("");
    setActive(true);
    setError("");
    setShowModal(true);
  };

  const openEdit = (driver: DriverRecord) => {
    setEditingDriver(driver);
    setName(driver.name);
    setPhone(driver.phone || "");
    setLocationId(driver.locationId || "");
    setActive(driver.active ?? driver.isActive ?? true);
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Driver name is required.");
      return;
    }
    try {
      if (editingDriver) {
        await updateDriver(editingDriver.id, { name, phone, location_id: locationId || null, active });
      } else {
        await createDriver({ name, phone, location_id: locationId || null });
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save driver");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;
    try {
      await deleteDriver(id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  return (
    <div className="w-full max-w-6xl px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="text-blue-900" /> Driver Master
            </h1>
            <p className="text-sm text-slate-500">Manage delivery drivers selectable during Cashier Clearance and Gate Out.</p>
          </div>
          <Button onClick={openCreate} className="bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-2">
            <Plus size={16} /> Add Driver
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading drivers...</div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 uppercase text-xs text-slate-600 border-b">
                <tr>
                  <th className="px-6 py-3">Driver Name</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Assigned Location</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No drivers found. Click &quot;Add Driver&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  drivers.map((drv) => (
                    <tr key={drv.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-800">{drv.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{drv.phone || "—"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          {drv.locationName || "All Locations"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(drv.active ?? drv.isActive) ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-semibold">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(drv)}>
                          <Edit size={14} className="mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(drv.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                {editingDriver ? "Edit Driver" : "Add New Driver"}
              </h2>
              {error && <div className="p-3 mb-4 bg-red-50 text-red-700 rounded text-xs">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Driver Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full mt-1 border border-slate-300 rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full mt-1 border border-slate-300 rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Assigned Location</label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded p-2 text-sm bg-white"
                  >
                    <option value="">All Locations (Global)</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                {editingDriver && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="activeDrvCb"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                    />
                    <label htmlFor="activeDrvCb" className="text-sm text-slate-700">
                      Active
                    </label>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white">
                    Save Driver
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
