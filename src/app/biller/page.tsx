"use client";

import React, { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import PartsPageSkeleton from "@/components/skeletons/PartsPageSkeleton";
import {
  TempCarsDataTable,
  tempCarsColumns,
} from "@/components/data-tables/temp-cars-data-table";
import { CarStatus, TempCarRecord, getAllActiveTempCars } from "@/lib/appwrite";

export default function Biller() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [tempCars, setTempCars] = useState<TempCarRecord[]>([]);

  useEffect(() => {
    const getUser = () => {
      try {
        const token = getCookie("user");
        if (!token) return;
        const parsed = JSON.parse(String(token));
        setName(parsed?.name ?? "");
      } catch {}
    };

    const loadCars = async () => {
      try {
        const res = await getAllActiveTempCars();
        const docs = (res?.documents ?? []) as unknown as TempCarRecord[];

        setTempCars(docs.filter((c) => c.carStatus !== CarStatus.EXITED));
      } finally {
        setLoading(false);
      }
    };

    getUser();
    loadCars();
  }, []);

  if (loading) return <PartsPageSkeleton />;

  return (
    <div className="flex flex-col w-[90%] mt-10">
      <div>
        <div className="font-semibold text-3xl">Hello {name || "Biller"}!</div>
        <div className="font-medium">T3, Mira Road</div>
      </div>

      <div className="flex flex-col mt-16">
        <div className="font-semibold text-2xl mb-5">Cars in Garage</div>
        <TempCarsDataTable columns={tempCarsColumns} data={tempCars} />
      </div>
    </div>
  );
}
