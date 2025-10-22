"use client";

import React, { useEffect, useState } from "react";
import PartsPageSkeleton from "@/components/skeletons/PartsPageSkeleton";
import {
  TempCarsDataTable,
  tempCarsColumns,
} from "@/components/data-tables/temp-cars-data-table";
import { CarStatus, TempCarRecord, getAllActiveTempCars } from "@/lib/appwrite";
import { ParkingSplitPie } from "@/components/graphs/ParkingSplitPie";
import { NightStockNew } from "@/components/graphs/NightStockNew";
import { TempCar } from "@/lib/definitions";
import { CurrentCarsPie } from "@/components/graphs/CurrentCarsPie";
import DisplayCard from "@/components/DisplayCard";
import { Wrench, ArrowRightToLine, ArrowLeftFromLine } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Biller() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tempCars, setTempCars] = useState<TempCarRecord[]>([]);

  const [inGarageCount, setInGarageCount] = useState<number>(0);
  const [todayInCount, setTodayInCount] = useState<number>(0);
  const [todayOutCount, setTodayOutCount] = useState<number>(0);

  useEffect(() => {
    const loadCars = async () => {
      try {
        const res = await getAllActiveTempCars();
        const docs = (res?.documents ?? []) as unknown as TempCarRecord[];
        const today = new Date().toISOString().split("T")[0];

        setInGarageCount(
          docs.filter((c) => c.carStatus !== CarStatus.EXITED).length
        );

        setTodayInCount(
          docs.filter(
            (c) =>
              // c.carStatus === CarStatus.ENTERED &&
              c.$createdAt?.split("T")[0] === today
          ).length
        );

        setTodayOutCount(
          docs.filter(
            (c) =>
              c.carStatus === CarStatus.EXITED &&
              c.$updatedAt?.split("T")[0] === today
          ).length
        );

        setTempCars(docs.filter((c) => c.carStatus !== CarStatus.EXITED));
      } finally {
        setLoading(false);
      }
    };

    loadCars();
  }, []);

  if (loading || authLoading) return <PartsPageSkeleton />;

  return (
    <div className="flex flex-col w-[90%] mt-10">
      <div>
        <div className="font-semibold text-3xl">Hello {user?.name || "Biller"}!</div>
        <div className="font-medium">T3, Mira Road</div>
      </div>
      {isAdmin && (
        <div className="flex mt-16 justify-evenly">
          <ParkingSplitPie tempCars={tempCars as TempCarRecord[]} />
          <NightStockNew tempCars={tempCars as TempCarRecord[]} />
          <CurrentCarsPie tempCars={tempCars as TempCarRecord[]} />
        </div>
      )}
      <div className="flex flex-row space-x-8 mt-16 w-full justify-center lg:justify-normal">
        <DisplayCard icon={<Wrench />} desc="In Garage" value={inGarageCount} />
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
