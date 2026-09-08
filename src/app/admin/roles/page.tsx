"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getRoles, createRole, updateRole, deleteRole, getPermissionsCatalog, RoleRecord, PermissionCatalogItem } from "@/lib/api";
import { ShieldCheck, Plus, Edit, Trash2 } from "lucide-react";

export default function RoleMasterPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);

  const [name, setName] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, cRes] = await Promise.all([getRoles(), getPermissionsCatalog()]);
      setRoles(rRes.documents || []);
      setCatalog(cRes || []);
    } catch (err: any) {
      setError(err.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingRole(null);
    setName("");
    setRoleKey("");
    setDescription("");
    setSelectedPermissions([]);
    setError("");
    setShowModal(true);
  };

  const openEdit = (role: RoleRecord) => {
    setEditingRole(role);
    setName(role.name);
    setRoleKey(role.role_key);
    setDescription(role.description || "");
    setSelectedPermissions(role.permissions || []);
    setError("");
    setShowModal(true);
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(catalog.map((p) => p.key));
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roleKey.trim()) {
      setError("Role Name and Role Key are required.");
      return;
    }
    try {
      if (editingRole) {
        await updateRole(editingRole.id, { name, description, permissions: selectedPermissions });
      } else {
        await createRole({ name, role_key: roleKey, description, permissions: selectedPermissions });
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save role");
    }
  };

  const handleDelete = async (role: RoleRecord) => {
    if (role.is_system || role.role_key === "admin") {
      alert("Built-in system roles cannot be deleted.");
      return;
    }
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return;
    try {
      await deleteRole(role.id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  // Group catalog by category
  const categories = Array.from(new Set(catalog.map((c) => c.cat)));

  return (
    <div className="w-full max-w-6xl px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-blue-900" /> Role Master & Granular Permissions
            </h1>
            <p className="text-sm text-slate-500">Configure roles and assign granular permission matrices across all Hyundai modules.</p>
          </div>
          <Button onClick={openCreate} className="bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-2">
            <Plus size={16} /> Create Role
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading roles...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="bg-white rounded-xl shadow border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="font-bold text-lg text-slate-800">{role.name}</h2>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {role.role_key}
                      </span>
                    </div>
                    {role.is_system ? (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-semibold">
                        System Role
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        Custom Role
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-4">{role.description || "No description provided."}</p>

                  <div className="border-t pt-3">
                    <div className="text-xs font-semibold uppercase text-slate-500 mb-2">
                      Permissions ({role.permissions?.length || 0})
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {(role.permissions || []).map((p) => (
                        <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] rounded font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                    <Edit size={14} className="mr-1" /> Edit Matrix
                  </Button>
                  {!role.is_system && (
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(role)}>
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                {editingRole ? `Edit Role Matrix — ${editingRole.name}` : "Create New Role"}
              </h2>
              {error && <div className="p-3 mb-4 bg-red-50 text-red-700 rounded text-xs">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">Role Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Senior Manager"
                      className="w-full mt-1 border border-slate-300 rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-600">Role Key *</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingRole}
                      value={roleKey}
                      onChange={(e) => setRoleKey(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                      placeholder="e.g. senior_manager"
                      className="w-full mt-1 border border-slate-300 rounded p-2 text-sm font-mono bg-slate-50 disabled:opacity-70"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Role responsibilities..."
                    className="w-full mt-1 border border-slate-300 rounded p-2 text-sm"
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-bold text-slate-800 uppercase">
                      Granular Permission Matrix ({selectedPermissions.length} selected)
                    </label>
                    <div className="space-x-2">
                      <Button type="button" variant="outline" size="sm" onClick={selectAllPermissions}>
                        Select All
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={clearAllPermissions}>
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {categories.map((cat) => (
                      <div key={cat} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-xs font-bold uppercase text-blue-900 mb-2">{cat}</div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {catalog
                            .filter((c) => c.cat === cat)
                            .map((perm) => (
                              <label
                                key={perm.key}
                                className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 hover:bg-slate-100 cursor-pointer text-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.includes(perm.key)}
                                  onChange={() => togglePermission(perm.key)}
                                />
                                <span className="font-semibold text-slate-700">{perm.label}</span>
                              </label>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white">
                    Save Role Matrix
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
