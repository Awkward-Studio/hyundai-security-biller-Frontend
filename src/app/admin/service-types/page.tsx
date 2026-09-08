"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getServiceTypes, createServiceType, updateServiceType, deleteServiceType, ServiceTypeRecord } from "@/lib/api";
import { BadgePercent, Plus, Edit, Trash2 } from "lucide-react";

export default function ServiceTypeMasterPage() {
  const [services, setServices] = useState<ServiceTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSvc, setEditingSvc] = useState<ServiceTypeRecord | null>(null);

  const [name, setName] = useState("");
  const [bodyshopOnly, setBodyshopOnly] = useState(false);
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await getServiceTypes();
      setServices(res.documents || []);
    } catch (err: any) {
      setError(err.message || "Failed to load service types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openCreate = () => {
    setEditingSvc(null);
    setName("");
    setBodyshopOnly(false);
    setActive(true);
    setError("");
    setShowModal(true);
  };

  const openEdit = (svc: ServiceTypeRecord) => {
    setEditingSvc(svc);
    setName(svc.name);
    setBodyshopOnly(!!svc.bodyshopOnly);
    setActive(svc.active ?? svc.isActive ?? true);
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Service type name is required.");
      return;
    }
    try {
      if (editingSvc) {
        await updateServiceType(editingSvc.id, { name, bodyshop_only: bodyshopOnly, active });
      } else {
        await createServiceType({ name, bodyshop_only: bodyshopOnly });
      }
      setShowModal(false);
      loadServices();
    } catch (err: any) {
      setError(err.message || "Failed to save service type");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service type?")) return;
    try {
      await deleteServiceType(id);
      loadServices();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  return (
    <div className="w-full max-w-6xl px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BadgePercent className="text-blue-900" /> Service Type Master
            </h1>
            <p className="text-sm text-slate-500">Configure Hyundai service categories (Free Service, Paid Service, Running Repair, Bodyshop, etc.).</p>
          </div>
          <Button onClick={openCreate} className="bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-2">
            <Plus size={16} /> Add Service Type
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading service types...</div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 uppercase text-xs text-slate-600 border-b">
                <tr>
                  <th className="px-6 py-3">Service Type Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400">
                      No service types found. Click &quot;Add Service Type&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  services.map((svc) => (
                    <tr key={svc.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-800">{svc.name}</td>
                      <td className="px-6 py-4">
                        {svc.bodyshopOnly ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                            Bodyshop Restricted
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            General Workshop
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(svc.active ?? svc.isActive) ? (
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
                        <Button variant="outline" size="sm" onClick={() => openEdit(svc)}>
                          <Edit size={14} className="mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(svc.id)}>
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
                {editingSvc ? "Edit Service Type" : "Add New Service Type"}
              </h2>
              {error && <div className="p-3 mb-4 bg-red-50 text-red-700 rounded text-xs">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Service Type Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Free Service"
                    className="w-full mt-1 border border-slate-300 rounded p-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="bodyshopOnlyCb"
                    checked={bodyshopOnly}
                    onChange={(e) => setBodyshopOnly(e.target.checked)}
                  />
                  <label htmlFor="bodyshopOnlyCb" className="text-sm text-slate-700">
                    Bodyshop Location Only
                  </label>
                </div>
                {editingSvc && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="activeSvcCb"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                    />
                    <label htmlFor="activeSvcCb" className="text-sm text-slate-700">
                      Active
                    </label>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white">
                    Save Service Type
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
