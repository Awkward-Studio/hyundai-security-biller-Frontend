"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CarStatus, TempCarRecord } from "@/lib/appwrite";

// Chart configuration mapping CarStatus to chart properties
export const chartConfig = {
  [CarStatus.ENTERED]: {
    label: "Entered",
    color: "hsl(var(--chart-1))",
  },
  [CarStatus.IN_PROGRESS]: {
    label: "In Progress",
    color: "hsl(var(--chart-2))",
  },
  [CarStatus.DONE]: {
    label: "Done",
    color: "hsl(var(--chart-3))",
  },
  [CarStatus.GATEPASS_GENERATED]: {
    label: "Gate Pass Generated",
    color: "hsl(var(--chart-4))",
  },
  [CarStatus.EXITED]: {
    label: "Exited",
    color: "hsl(var(--chart-5))",
  },
} as const;

interface CurrentCarsPieProps {
  tempCars: TempCarRecord[];
}

export function CurrentCarsPie({ tempCars }: CurrentCarsPieProps) {
  const chartData = useMemo(() => {
    const statusCounts = tempCars.reduce<Record<CarStatus, number>>(
      (acc, car) => {
        const status = car.carStatus;
        if (Object.values(CarStatus).includes(status)) {
          acc[status] = (acc[status] || 0) + 1;
        }
        return acc;
      },
      {} as Record<CarStatus, number>
    );

    return Object.entries(statusCounts).map(([status, count]) => {
      const config = chartConfig[status as CarStatus];
      return {
        name: config.label,
        value: count,
        fill: config.color,
      };
    });
  }, [tempCars]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Current Cars</CardTitle>
        <CardDescription>At Present</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] mt-6"
        >
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              stroke="0"
              fill="#8884d8"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
