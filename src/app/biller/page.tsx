"use client";

import React, { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { toast } from "sonner";
import PartsPageSkeleton from "@/components/skeletons/PartsPageSkeleton";
import PrimaryButton from "@/components/PrimaryButton";
import {
  TempCarsDataTable,
  tempCarsColumns,
} from "@/components/data-tables/temp-cars-data-table";
import {
  CarStatus,
  TempCarRecord,
  getAllActiveTempCars,
  getAllTempCarsToday,
} from "@/lib/api";
import { ParkingSplitPie } from "@/components/graphs/ParkingSplitPie";
import { NightStockNew } from "@/components/graphs/NightStockNew";
import { TempCar } from "@/lib/definitions";
import { CurrentCarsPie } from "@/components/graphs/CurrentCarsPie";
import DisplayCard from "@/components/DisplayCard";
import {
  Wrench,
  ArrowRightToLine,
  ArrowLeftFromLine,
  Download,
} from "lucide-react";
import { purposeOfVisits } from "@/lib/helper"; // reuse your purpose list if available
import { Button } from "@/components/ui/button";

export default function Biller() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [tempCars, setTempCars] = useState<TempCarRecord[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [inGarageCount, setInGarageCount] = useState<number>(0);
  const [todayInCount, setTodayInCount] = useState<number>(0);
  const [todayOutCount, setTodayOutCount] = useState<number>(0);

  useEffect(() => {
    const getUser = () => {
      try {
        const token = getCookie("user");
        if (!token) return;
        const parsed = JSON.parse(String(token));
        const labels = Array.isArray(parsed?.labels) ? parsed.labels : [];
        const role = typeof labels[0] === "string" ? labels[0] : null;
        setIsAdmin(role === "admin");
        setName(parsed?.name ?? "");
      } catch {}
    };

    const loadCars = async () => {
      try {
        const res = await getAllActiveTempCars();
        const todayRes = await getAllTempCarsToday();
        const todayTrueInCars = (todayRes?.documents ??
          []) as unknown as TempCarRecord[];
        const docs = (res?.documents ?? []) as unknown as TempCarRecord[];

        setInGarageCount(
          docs.filter((c) => c.carStatus !== CarStatus.EXITED).length
        );

        setTodayInCount(
          todayTrueInCars.filter(
            (c) =>
              c.$createdAt?.split("T")[0] ===
              new Date().toISOString().split("T")[0]
          ).length
        );

        setTodayOutCount(
          todayTrueInCars.filter(
            (c) =>
              c.carStatus === CarStatus.EXITED &&
              c.$updatedAt?.split("T")[0] ===
                new Date().toISOString().split("T")[0]
          ).length
        );

        console.log(docs);

        setTempCars(docs);
      } finally {
        setLoading(false);
      }
    };

    getUser();
    loadCars();
  }, []);

  if (loading) return <PartsPageSkeleton />;

  /* ---------------- CSV helpers (local copy) ---------------- */

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
    "purposesOfVisit",
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

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const formatDate = (d: Date | null) =>
    d
      ? `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
      : "";
  const formatTime = (d: Date | null) =>
    d ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}` : "";

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

  const formatDateForName = (d: Date) => formatDate(d).replace(/:/g, "-");

  /* ---------------- Download handler ---------------- */

  const downloadGarageReport = async () => {
    try {
      setLoading(true);
      // Cars currently in garage: not EXITED
      const inGarage = tempCars.filter((c) => c.carStatus !== CarStatus.EXITED);

      if (!inGarage.length) {
        toast("No cars in garage to export");
        return;
      }

      const rows: ReportRow[] = inGarage.map((d: any) => {
        const inDateObj = d?.$createdAt ? new Date(d.$createdAt) : null;
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
      const now = new Date();
      const fileName = `garage_reports_${formatDateForName(now)}.csv`;
      downloadCSV(csv, fileName);
      toast("Garage report downloaded ✅");
    } catch (err) {
      console.error(err);
      toast("Could not generate garage report");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------- */

  return (
    <div className="flex flex-col w-[90%] mt-10">
      <div>
        <div className="font-semibold text-3xl">Hello {name || "Biller"}!</div>
        <div className="font-medium">Index Service Center, Mira Road</div>
      </div>
      {isAdmin && (
        <div className="flex mt-16 justify-evenly">
          <ParkingSplitPie tempCars={tempCars as TempCarRecord[]} />
          <NightStockNew tempCars={tempCars as TempCarRecord[]} />
          <CurrentCarsPie tempCars={tempCars as TempCarRecord[]} />
        </div>
      )}
      <div className="flex flex-row space-x-8 mt-16 w-full justify-center lg:justify-normal">
        <DisplayCard
          icon={<Wrench />}
          desc="In Garage"
          value={inGarageCount}
          button={
            <Button
              onClick={downloadGarageReport}
              disabled={loading}
              className="w-fit bg-blue-600"
            >
              <Download />
            </Button>
          }
        />
        <DisplayCard
          icon={<ArrowRightToLine />}
          desc="In Today"
          value={todayInCount}
        />
        <DisplayCard
          icon={<ArrowLeftFromLine />}
          desc="Out Today"
          value={todayOutCount}
        />
      </div>

      <div className="flex flex-col mt-16">
        <div className="font-semibold text-2xl mb-5">Cars in Garage</div>
        <TempCarsDataTable columns={tempCarsColumns} data={tempCars} />
      </div>
    </div>
  );
}
