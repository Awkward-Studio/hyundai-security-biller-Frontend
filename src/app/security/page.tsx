"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import DisplayCard from "@/components/DisplayCard";
import PartsPageSkeleton from "@/components/skeletons/PartsPageSkeleton";
import { Wrench, Plus } from "lucide-react";
import {
  TempCarsDataTable,
  tempCarsColumns,
} from "@/components/data-tables/temp-cars-data-table";

import {
  CarStatus,
  type TempCarRecord,
  getAllActiveTempCars,
} from "@/lib/appwrite";

type Props = {};

export default function Security({}: Props) {
  const pathname = usePathname();

  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [inGarageCount, setInGarageCount] = useState<number>(0);
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

    const loadTempCars = async () => {
      try {
        const res = await getAllActiveTempCars();
        const docs = (res?.documents ?? []) as unknown as TempCarRecord[];

        setInGarageCount(
          docs.filter((c) => c.carStatus !== CarStatus.EXITED).length
        );

        setTempCars(docs);
      } finally {
        setLoading(false);
      }
    };

    getUser();
    loadTempCars();
  }, []);

  if (loading) return <PartsPageSkeleton />;

  return (
    <div className="flex flex-col w-[90%] mt-32">
      <Link
        className="fixed z-20 bottom-7 right-7 bg-red-500 p-3 rounded-xl border-2 border-black"
        href={`${pathname}/addCar`}
      >
        <Plus size={40} color="white" />
      </Link>

      <div>
        <div className="font-semibold text-3xl">Hello {name || "there"}!</div>
        <div className="font-medium">T3, Mira Road</div>
      </div>

      <div className="flex flex-row space-x-8 mt-16 w-full justify-center lg:justify-normal">
        <DisplayCard icon={<Wrench />} desc="In Garage" value={inGarageCount} />
      </div>

      <div className="flex flex-col mt-16">
        <div className="font-semibold text-2xl mb-5">All Cars</div>{" "}
        <TempCarsDataTable columns={tempCarsColumns} data={tempCars} />
      </div>
    </div>
  );
}
