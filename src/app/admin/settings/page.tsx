"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { getAppSettings, updateAppSettings, AppSettingRecord } from "@/lib/api";
import { Settings, Save, Upload, Image as ImageIcon, RefreshCw } from "lucide-react";

export default function AppSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState<AppSettingRecord>({
    brand_name: "Index Hyundai",
    subtitle: "Gate Management System",
    brand_subtitle: "Gate Management",
    welcome_title: "Welcome Back",
    welcome_desc:
      "Secure vehicle in/out management across all Index Hyundai locations. Log in with your assigned credentials to access your operational dashboard.",
    feature_list:
      "Real-time vehicle tracking\nMulti-Location Gate Management\nCashier clearance workflow\nExcel & CSV reports",
    signin_title: "Sign In",
    signin_subtitle: "Enter your credentials to continue",
    signin_btn: "Sign In",
    credit_text: "Made by: Hemant Govindjiwale",
    footer_text: "© 2026 Index Hyundai",
    logo_data_url: "",
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAppSettings();
      if (data) {
        setForm({
          brand_name: data.brand_name || "Index Hyundai",
          subtitle: data.subtitle || "Gate Management System",
          brand_subtitle: data.brand_subtitle || "Gate Management",
          welcome_title: data.welcome_title || "Welcome Back",
          welcome_desc: data.welcome_desc || "",
          feature_list: data.feature_list || "",
          signin_title: data.signin_title || "Sign In",
          signin_subtitle: data.signin_subtitle || "",
          signin_btn: data.signin_btn || "Sign In",
          credit_text: data.credit_text || "",
          footer_text: data.footer_text || "© 2026 Index Hyundai",
          logo_data_url: data.logo_data_url || "",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (field: keyof AppSettingRecord, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert("Logo image file size must be less than 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, logo_data_url: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await updateAppSettings(form);
      setSuccess("App settings & branding updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save app settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar home="/admin" />
      <div className="flex-1 p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Settings className="text-blue-900" /> App Settings &amp; White-Labeling
            </h1>
            <p className="text-sm text-slate-500">
              Customize dealership branding, upload custom logo, and configure sign-in panel text.
            </p>
          </div>
          <Button onClick={loadSettings} variant="outline" className="flex items-center gap-2">
            <RefreshCw size={16} /> Reset Form
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
          <div className="text-center py-12 text-slate-500">Loading settings...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            {/* Branding Section */}
            <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                🏢 Dealership Identity &amp; Titles
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={form.brand_name}
                    onChange={(e) => handleChange("brand_name", e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">System Subtitle</label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => handleChange("subtitle", e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded p-2.5 text-sm"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Footer Copyright Text</label>
                  <input
                    type="text"
                    value={form.footer_text}
                    onChange={(e) => handleChange("footer_text", e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Credits Text</label>
                  <input
                    type="text"
                    value={form.credit_text}
                    onChange={(e) => handleChange("credit_text", e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded p-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Custom Logo Section */}
            <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                <ImageIcon className="text-blue-900" /> Custom Dealership Logo
              </h2>
              <div className="flex items-start gap-6">
                <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden relative">
                  {form.logo_data_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={form.logo_data_url} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-xs text-slate-400 text-center px-2">No custom logo uploaded</span>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg cursor-pointer hover:bg-blue-800">
                    <Upload size={16} /> Choose Logo Image (PNG / JPG / SVG)
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {form.logo_data_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleChange("logo_data_url", "")}
                      className="text-red-700 border-red-200 block"
                    >
                      Remove Logo (Restore Default)
                    </Button>
                  )}
                  <p className="text-xs text-slate-500">
                    Recommended resolution: 250x100px. Maximum size: 500 KB.
                  </p>
                </div>
              </div>
            </div>

            {/* Welcome & Login Text Section */}
            <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                🔑 Sign-In Panel &amp; Welcome Messages
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Welcome Title</label>
                  <input
                    type="text"
                    value={form.welcome_title}
                    onChange={(e) => handleChange("welcome_title", e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-600">Sign In Card Header</label>
                  <input
                    type="text"
                    value={form.signin_title}
                    onChange={(e) => handleChange("signin_title", e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded p-2.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-600">Welcome Description</label>
                <textarea
                  rows={2}
                  value={form.welcome_desc}
                  onChange={(e) => handleChange("welcome_desc", e.target.value)}
                  className="w-full mt-1 border border-slate-300 rounded p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-600">Feature Bullet List (One item per line)</label>
                <textarea
                  rows={4}
                  value={form.feature_list}
                  onChange={(e) => handleChange("feature_list", e.target.value)}
                  className="w-full mt-1 border border-slate-300 rounded p-2.5 text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saving} className="bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-2 px-6 py-2.5">
                <Save size={18} /> {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
