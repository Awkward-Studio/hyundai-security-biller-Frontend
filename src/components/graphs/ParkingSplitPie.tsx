"use client";

import { useMemo } from "react";
import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TempCarRecord } from "@/lib/appwrite";

// Chart configuration for the pie chart
export const chartConfig = {
  visitors: {
    label: "Cars",
  },
  workshop: {
    label: "Workshop",
    color: "hsl(var(--chart-2))",
  },
  parking: {
    label: "Parking Lot",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function ParkingSplitPie({ tempCars }: { tempCars: TempCarRecord[] }) {
  const chartData = useMemo(() => {
    let inParkingCount = 0;
    let inWorkshopCount = 0;

    tempCars.forEach((car) => {
      if (car.inParking) {
        inParkingCount++;
      } else {
        inWorkshopCount++;
      }
    });

    return [
      {
        browser: "workshop",
        visitors: inWorkshopCount,
        fill: "var(--color-workshop)",
      },
      {
        browser: "parking",
        visitors: inParkingCount,
        fill: "var(--color-parking)",
      },
    ];
  }, [tempCars]);

  return (
    <Card className="flex flex-col w-[25%]">
      <CardHeader className="items-center pb-0">
        <CardTitle>Parking Split</CardTitle>
        <CardDescription>At Present</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie data={chartData} dataKey="visitors" nameKey="browser" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
