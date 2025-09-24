"use client";

import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { DateRangePicker } from "@/components/DateRangePicker";
import PrimaryButton from "@/components/PrimaryButton";
import PartsPageSkeleton from "@/components/skeletons/PartsPageSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getFirstTempCarDate, getTempCarsBetween } from "@/lib/appwrite";

import {
  adminReportTimelineDrop,
  createDateExpandedObj,
  purposeOfVisits,
} from "@/lib/helper";

type Props = {};

export default function Reports({}: Props) {
  const [loading, setLoading] = useState(false);
  const [isMakingReport, setIsMakingReport] = useState(false);

  const [customDateRange, setCustomDateRange] = useState<DateRange>();
  const [currentSelectedTimeline, setCurrentSelectedTimeline] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Initialize default range: first temp car -> today
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const first = await getFirstTempCarDate();
        setCustomDateRange({ from: first, to: new Date() });
        setCurrentSelectedTimeline("custom"); // still shows presets; default is the full span
        setShowDatePicker(true);
      } catch (e) {
        // Fallback if there’s no data yet
        const today = new Date();
        setCustomDateRange({ from: today, to: today });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const modifyReportsTimeline = async (timeline: string) => {
    setShowDatePicker(false);
    const todaysDate = await createDateExpandedObj(new Date());

    switch (timeline) {
      case "thisQuarter": {
        const m = Number(todaysDate.month) - 1;
        const qStartMonth = m - (m % 3);
        setCustomDateRange({
          from: new Date(Number(todaysDate.year), qStartMonth, 1),
          to: new Date(),
        });
        break;
      }
      case "lastSixMonths": {
        const y = Number(todaysDate.year);
        const m = Number(todaysDate.month) - 1;
        const from = new Date(y, m - 5, 1);
        setCustomDateRange({ from, to: new Date() });
        break;
      }
      case "lastYear": {
        setCustomDateRange({
          from: new Date(
            Number(todaysDate.year) - 1,
            Number(todaysDate.month) - 1,
            1
          ),
          to: new Date(
            Number(todaysDate.year),
            Number(todaysDate.month) - 1,
            0
          ),
        });
        break;
      }
      case "custom": {
        setShowDatePicker(true);
        break;
      }
      default: {
        // keep your existing keys working too
        if (timeline === "thisMonth") {
          setCustomDateRange({
            from: new Date(
              Number(todaysDate.year),
              Number(todaysDate.month) - 1,
              1
            ),
            to: new Date(),
          });
        } else if (timeline === "lastMonth") {
          if (Number(todaysDate.month) !== 1) {
            setCustomDateRange({
              from: new Date(
                Number(todaysDate.year),
                Number(todaysDate.month) - 2,
                1
              ),
              to: new Date(
                Number(todaysDate.year),
                Number(todaysDate.month) - 1,
                0
              ),
            });
          } else {
            setCustomDateRange({
              from: new Date(Number(todaysDate.year) - 1, 11, 1),
              to: new Date(Number(todaysDate.year) - 1, 12, 0),
            });
          }
        }
        break;
      }
    }
    setCurrentSelectedTimeline(timeline);
  };

  const downloadTempCarsReport = async () => {
    if (!customDateRange?.from || !customDateRange?.to) {
      toast("Please select a date range");
      return;
    }
    setIsMakingReport(true);
    setLoading(true);
    try {
      const res = await getTempCarsBetween(
        customDateRange.from,
        customDateRange.to
      );
      const docs = res?.documents ?? [];

      if (docs.length === 0) {
        toast("No data in this range");
        return;
      }

      const rows: ReportRow[] = docs.map((d: any) => {
        // Pull only what we want, map PoVs, and rename dates
        const inDate = d?.$createdAt
          ? new Date(d.$createdAt).toISOString()
          : "";
        const outDate =
          d?.redundant === true && d?.$updatedAt
            ? new Date(d.$updatedAt).toISOString()
            : "";

        return {
          carNumber: d?.carNumber ?? "",
          carMake: d?.carMake ?? "",
          carModel: d?.carModel ?? "",
          location: d?.location ?? "",
          carsTableId: d?.carsTableId ?? "",
          purposesOfVisit: mapPurposes(d?.purposesOfVisit ?? []),
          carStatus: d?.carStatus ?? "",
          gatePassPDF: d?.gatePassPDF ?? "",
          inParking: Boolean(d?.inParking ?? false),
          "in-date": inDate,
          "out-date": outDate, // always in header, blank if not eligible
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
      setIsMakingReport(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-[90%] mt-20">
      <div>
        <div className="font-semibold text-3xl">Reports</div>

        <div className="mt-5">
          <Select onValueChange={(v) => modifyReportsTimeline(v)}>
            <SelectTrigger className="w-full mb-10">
              <SelectValue placeholder="Select Reports Timeline" />
            </SelectTrigger>
            <SelectContent>
              {adminReportTimelineDrop.map((item) => (
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

              {/* Ensure quarter/six months/year presets are present */}
              <SelectItem value="thisQuarter">This Quarter</SelectItem>
              <SelectItem value="lastSixMonths">Last 6 Months</SelectItem>
              <SelectItem value="lastYear">Last Year</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
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

      <div className="flex flex-row mt-10 justify-evenly items-center h-fit mb-10">
        {loading ? (
          <PartsPageSkeleton />
        ) : (
          currentSelectedTimeline && (
            <PrimaryButton
              title={"Download Reports"}
              handleButtonPress={downloadTempCarsReport}
              isLoading={isMakingReport}
            />
          )
        )}
      </div>
    </div>
  );
}

/** ---------- helpers (same style as your snippet) ---------- */

const convertArrayToCSV = (array: any[]) => {
  const header = Object.keys(array[0]).join(",") + "\n";
  const rows = array
    .map((item: any) =>
      Object.values(item)
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  return header + rows;
};

const downloadCSV = (csvContent: string, fileName: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const formatRangeForName = (range: DateRange) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const f = range.from!;
  const t = range.to!;
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `${fmt(f)}_to_${fmt(t)}`;
};

const povMap = new Map<number, string>(
  purposeOfVisits.map((p) => [p.code, p.description])
);

const mapPurposes = (arr: unknown): string => {
  // Accept numbers, numeric strings, or plain strings
  if (!Array.isArray(arr)) return "";
  const labels = arr.map((v) => {
    if (typeof v === "number") return povMap.get(v) ?? String(v);
    if (typeof v === "string") {
      const n = Number(v);
      if (!Number.isNaN(n) && povMap.has(n)) return povMap.get(n)!;
      return v; // already a label
    }
    return String(v ?? "");
  });
  // Join with " | " to avoid CSV comma collisions
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
  "out-date",
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
