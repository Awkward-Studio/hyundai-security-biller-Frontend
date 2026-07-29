"use client";

import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import Image from "next/image";
import loader from "../../../../public/assets/t3-loader.gif";

import { DateRangePicker } from "@/components/DateRangePicker";
import PrimaryButton from "@/components/PrimaryButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getFirstTempCarDate, getTempCarsBetween } from "@/lib/api";
import {
  adminReportTimelineDrop,
  createDateExpandedObj,
  purposeOfVisits,
} from "@/lib/helper";

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [showOnlyInParking, setShowOnlyInParking] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<DateRange>();
  const [currentSelectedTimeline, setCurrentSelectedTimeline] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const TIMELINE_PRESETS = useMemo(() => {
    const base = [
      ...adminReportTimelineDrop,
      { key: "thisQuarter", value: "This Quarter" },
      { key: "lastSixMonths", value: "Last 6 Months" },
      { key: "lastYear", value: "Last Year" },
      { key: "custom", value: "Custom" },
    ];
    const map = new Map<string, { key: string; value: string }>();
    for (const it of base) if (!map.has(it.key)) map.set(it.key, it);
    return Array.from(map.values());
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const first = await getFirstTempCarDate();
        setCustomDateRange({ from: first, to: new Date() });
        setCurrentSelectedTimeline("custom");
        setShowDatePicker(true);
      } catch {
        const today = new Date();
        setCustomDateRange({ from: today, to: today });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const modifyReportsTimeline = async (timeline: string) => {
    setShowDatePicker(false);
    const today = await createDateExpandedObj(new Date());
    const y = Number(today.year);
    const m = Number(today.month) - 1;

    switch (timeline) {
      case "thisQuarter": {
        const qStartMonth = m - (m % 3);
        setCustomDateRange({
          from: new Date(y, qStartMonth, 1),
          to: new Date(),
        });
        break;
      }
      case "lastSixMonths":
        setCustomDateRange({ from: new Date(y, m - 5, 1), to: new Date() });
        break;
      case "lastYear":
        setCustomDateRange({
          from: new Date(y - 1, 0, 1),
          to: new Date(y - 1, 11, 31),
        });
        break;
      case "custom":
        setShowDatePicker(true);
        break;
      case "thisMonth":
        setCustomDateRange({ from: new Date(y, m, 1), to: new Date() });
        break;
      case "lastMonth":
        setCustomDateRange(
          m === 0
            ? { from: new Date(y - 1, 11, 1), to: new Date(y - 1, 11, 31) }
            : { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) }
        );
        break;
      default:
        break;
    }
    setCurrentSelectedTimeline(timeline);
  };

  const downloadTempCarsReport = async () => {
    if (!customDateRange?.from || !customDateRange?.to) {
      toast("Please select a date range");
      return;
    }

    setLoading(true);
    try {
      const res = await getTempCarsBetween(
        customDateRange.from,
        customDateRange.to
      );
      let docs = res?.documents ?? [];

      if (showOnlyInParking)
        docs = docs.filter((d: any) => d?.inParking === true);

      if (docs.length === 0) {
        toast("No data in this range");
        return;
      }

      const rows: ReportRow[] = docs.map((d: any) => {
        const inDateObj = d?.$createdAt ? new Date(d.$createdAt) : null;

        // show out-date/time ONLY when truly exited (explicit)
        const status = String(d?.carStatus ?? "")
          .trim()
          .toUpperCase();
        const isExited = status === "EXITED";
        const outDateObj =
          isExited && d?.$updatedAt ? new Date(d.$updatedAt) : null;

        return {
          carNumber: d?.carNumber ?? "",
          carMake: d?.carMake ?? "",
          carModel: d?.carModel ?? "",
          location: d?.location ?? "",
          carsTableId: d?.carsTableId ?? "",
          purposesOfVisit: mapPurposes(d?.purposesOfVisit ?? []),
          carStatus: d?.carStatus ?? "",
          gatePassPDF: d?.gatePassPDF ?? "",
          inParking: d?.inParking ? "Yes" : "No",
          "in-date": formatDate(inDateObj),
          "in-time": formatTime(inDateObj),
          "out-date": isExited ? formatDate(outDateObj) : "",
          "out-time": isExited ? formatTime(outDateObj) : "",
        };
      });

      const csv = convertArrayToCSVWithHeaders(rows);
      downloadCSV(
        csv,
        `reports_tempcars_${formatRangeForName(customDateRange)}.csv`
      );
      toast("Report Generated ✅");
    } catch (e) {
      console.error(e);
      toast("Could not generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FULL-PAGE LOADER OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm grid place-items-center">
          <Image
            src={loader}
            width={120}
            height={120}
            alt="Loading..."
            priority
          />
        </div>
      )}

      <div className="flex flex-col w-[90%] mt-20">
        <div>
          <div className="font-semibold text-3xl">Reports</div>

          <div className="mt-5">
            <Select onValueChange={(v) => modifyReportsTimeline(v)}>
              <SelectTrigger className="w-full mb-10">
                <SelectValue placeholder="Select Reports Timeline" />
              </SelectTrigger>
              <SelectContent>
                {TIMELINE_PRESETS.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    <div className="flex space-x-5 items-center">
                      <div>{item.value}</div>
                      {currentSelectedTimeline === item.key && (
                        <div className="text-xs font-semibold text-red-500">
                          Current
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentSelectedTimeline === "custom" && showDatePicker && (
            <DateRangePicker
              dateRange={customDateRange}
              setCustomDateRange={setCustomDateRange}
            />
          )}
        </div>

        {/* Checkbox + button row */}
        <div className="flex items-center w-full mt-10">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyInParking}
              onChange={(e) => setShowOnlyInParking(e.target.checked)}
            />
            <span>Show only cars currently in parking</span>
          </label>
        </div>
        <div className="flex w-full justify-end mt-10">
          <div className="w-full max-w-sm">
            <PrimaryButton
              title="Download Reports"
              handleButtonPress={downloadTempCarsReport}
              disabled={loading}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------ helpers ------------------ */

const povMap = new Map<number, string>(
  purposeOfVisits.map((p) => [p.code, p.description])
);

const mapPurposes = (arr: unknown): string => {
  if (!Array.isArray(arr)) return "";
  const labels = arr.map((v) => {
    if (typeof v === "number") return povMap.get(v) ?? String(v);
    if (typeof v === "string") {
      const n = Number(v);
      if (!Number.isNaN(n) && povMap.has(n)) return povMap.get(n)!;
      return v;
    }
    return String(v ?? "");
  });
  return labels.join(" | ");
};

const REPORT_HEADERS = [
  "carNumber",
  "carMake",
  "carModel",
  "location",
  "carsTableId",
  "purposesOfVisit",
  "carStatus",
  "gatePassPDF",
  "inParking",
  "in-date",
  "in-time",
  "out-date",
  "out-time",
] as const;

type ReportRow = Record<
  (typeof REPORT_HEADERS)[number],
  string | number | boolean
>;

const convertArrayToCSVWithHeaders = (rows: ReportRow[]) => {
  const headerLine = REPORT_HEADERS.join(",") + "\n";
  const body = rows
    .map((row) =>
      REPORT_HEADERS.map((h) => {
        const value = row[h] ?? "";
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(",")
    )
    .join("\n");
  return headerLine + body;
};

const downloadCSV = (csvContent: string, fileName: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const formatDate = (d: Date | null) =>
  d ? `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` : "";
const formatTime = (d: Date | null) =>
  d ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}` : "";

const formatRangeForName = (range: DateRange) => {
  const f = range.from!;
  const t = range.to!;
  return `${formatDate(f)}_to_${formatDate(t)}`;
};
