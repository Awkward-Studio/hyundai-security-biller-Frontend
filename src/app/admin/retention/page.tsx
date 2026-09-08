"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getRetentionStats, runRetentionCleanup } from "@/lib/api";
import { Clock, ShieldAlert, Trash2, CheckCircle2 } from "lucide-react";

export default function LogRetentionPage() {
  const [stats, setStats] = useState<{
    totalRecords: number;
    activeRecords: number;
    prunableRecords: number;
    retentionDays: number;
  } | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [pruning, setPruning] = useState(false);
  const [message, setMessage] = useState("");

  const loadStats = async (retentionDays = days) => {
    try {
      setLoading(true);
      const res = await getRetentionStats(retentionDays);
      setStats(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handlePrune = async () => {
    if (
      !confirm(
        `Are you sure you want to permanently prune ${stats?.prunableRecords || 0} completed logs older than ${days} days?\n\nActive vehicles are NEVER deleted.`
      )
    ) {
      return;
    }
    try {
      setPruning(true);
      const res = await runRetentionCleanup(days);
      setMessage(res.message);
      loadStats(days);
    } catch (err: any) {
      alert(err.message || "Pruning failed");
    } finally {
      setPruning(false);
    }
  };

  return (
    <div className="w-full max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="text-blue-900" /> Log Retention Management
          </h1>
          <p className="text-sm text-slate-500">
            Safely auto-prune completed vehicle logs based on age retention rules.
          </p>
        </div>

        {message && (
          <div className="p-4 mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
            <CheckCircle2 size={20} />
            <div className="font-semibold text-sm">{message}</div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Retention Period Threshold</h2>
              <p className="text-xs text-slate-500">Select threshold in days for completed logs pruning.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 30;
                  setDays(val);
                  loadStats(val);
                }}
                className="w-24 border border-slate-300 rounded p-2 text-sm text-center font-bold"
              />
              <span className="text-sm text-slate-600 font-semibold">Days</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs uppercase font-bold text-slate-500 mb-1">Total System Records</div>
              <div className="text-3xl font-extrabold text-slate-800">
                {loading ? "..." : stats?.totalRecords}
              </div>
              <div className="text-xs text-slate-500 mt-1">All vehicle entries</div>
            </div>

            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-xs uppercase font-bold text-emerald-700 mb-1">Protected Active Vehicles</div>
              <div className="text-3xl font-extrabold text-emerald-800">
                {loading ? "..." : stats?.activeRecords}
              </div>
              <div className="text-xs text-emerald-700 mt-1">Never pruned regardless of age</div>
            </div>

            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xs uppercase font-bold text-amber-700 mb-1">Prunable Completed Logs</div>
              <div className="text-3xl font-extrabold text-amber-800">
                {loading ? "..." : stats?.prunableRecords}
              </div>
              <div className="text-xs text-amber-700 mt-1">Completed &gt; {days} days ago</div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded text-sm text-slate-700 mb-6">
            <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
              <ShieldAlert size={16} /> Safe Pruning Protection Rules
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
              <li>Active vehicles (&quot;Entered&quot;, &quot;In Workshop&quot;, &quot;Cleared by Cashier&quot;) are NEVER deleted.</li>
              <li>Only &quot;Completed&quot; or &quot;Exited&quot; vehicle logs older than {days} days will be cleaned up.</li>
              <li>Main permanent vehicle catalog records (`Car`) remain available for customer history.</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={pruning || !stats?.prunableRecords}
              onClick={handlePrune}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <Trash2 size={16} /> Prune {stats?.prunableRecords || 0} Old Completed Logs Now
            </Button>
          </div>
        </div>
    </div>
  );
}
