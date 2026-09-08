"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getLocations, createLocation, updateLocation, deleteLocation, LocationRecord } from "@/lib/api";
import { MapPin, Plus, Edit, Trash2 } from "lucide-react";

export default function LocationMasterPage() {
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<LocationRecord | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isBodyshop, setIsBodyshop] = useState(false);
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");

  const loadLocations = async () => {
    try {
      setLoading(true);
      const res = await getLocations();
      setLocations(res.documents || []);
    } catch (err: any) {
      setError(err.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const openCreate = () => {
    setEditingLoc(null);
    setName("");
    setCode("");
    setIsBodyshop(false);
    setActive(true);
    setError("");
    setShowModal(true);
  };

  const openEdit = (loc: LocationRecord) => {
    setEditingLoc(loc);
    setName(loc.name);
    setCode(loc.code || "");
    setIsBodyshop(!!loc.isBodyshop);
    setActive(loc.active ?? loc.isActive ?? true);
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Location name is required.");
      return;
    }
    try {
      if (editingLoc) {
        await updateLocation(editingLoc.id, { name, code, is_bodyshop: isBodyshop, active });
      } else {
        await createLocation({ name, code, is_bodyshop: isBodyshop });
      }
      setShowModal(false);
      loadLocations();
    } catch (err: any) {
      setError(err.message || "Failed to save location");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    try {
      await deleteLocation(id);
      loadLocations();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  return (
    <div className="w-full max-w-6xl px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="text-blue-900" /> Location Master
            </h1>
            <p className="text-sm text-slate-500">Manage Hyundai dealership and workshop locations.</p>
          </div>
          <Button onClick={openCreate} className="bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-2">
            <Plus size={16} /> Add Location
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading locations...</div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 uppercase text-xs text-slate-600 border-b">
                <tr>
                  <th className="px-6 py-3">Location Name</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {locations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No locations found. Click &quot;Add Location&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-800">{loc.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{loc.code || "—"}</td>
                      <td className="px-6 py-4">
                        {loc.isBodyshop ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                            Bodyshop
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            Workshop / General
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(loc.active ?? loc.isActive) ? (
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
                        <Button variant="outline" size="sm" onClick={() => openEdit(loc)}>
                          <Edit size={14} className="mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(loc.id)}>
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
                {editingLoc ? "Edit Location" : "Add New Location"}
              </h2>
              {error && <div className="p-3 mb-4 bg-red-50 text-red-700 rounded text-xs">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Location Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mira Road Workshop"
                    className="w-full mt-1 border border-slate-300 rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Short Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. MRW"
                    className="w-full mt-1 border border-slate-300 rounded p-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="bodyshopCb"
                    checked={isBodyshop}
                    onChange={(e) => setIsBodyshop(e.target.checked)}
                  />
                  <label htmlFor="bodyshopCb" className="text-sm text-slate-700">
                    Is Bodyshop Location (restricts default service types to Bodyshop)
                  </label>
                </div>
                {editingLoc && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="activeCb"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                    />
                    <label htmlFor="activeCb" className="text-sm text-slate-700">
                      Active
                    </label>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white">
                    Save Location
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
