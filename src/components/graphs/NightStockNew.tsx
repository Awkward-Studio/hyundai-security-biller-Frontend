"use client";

import { TrendingUp } from "lucide-react";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect } from "react";
import { TempCar } from "@/lib/definitions";
import { TempCarRecord } from "@/lib/appwrite";

const TOTAL_PARKING_SPACE = 400;

let carsBeingWorkedOn = 0;
let gatePassGenerated = 0;

const chartData = [
  { month: "january", carsBeingWorkedOn: 80, gatePassGenerated: 7, empty: 0 },
];

const chartConfig = {
  carsBeingWorkedOn: {
    label: "Cars Being Worked On ",
    color: "hsl(var(--chart-2))",
  },
  gatePassGenerated: {
    label: "Gate Pass Generated",
    color: "hsl(var(--chart-1))",
  },
  empty: {
    label: "Empty",
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig;

export function NightStockNew({ tempCars }: { tempCars: TempCarRecord[] }) {
  let totalCars = tempCars.length;
  const emptySpace = TOTAL_PARKING_SPACE - totalCars;
  chartData[0].empty = emptySpace;

  useEffect(() => {
    let carsBeingWorkedOnCount = 0;
    let gatePassGeneratedCount = 0;

    const statusCounts = tempCars.reduce((acc: any, curr: any) => {
      // Use carStatus from TempCarRecord
      acc[curr.carStatus] = (acc[curr.carStatus] || 0) + 1;
      return acc;
    }, {});

    // Create the formatted dataset
    const formattedDataset = Object.entries(statusCounts).map(
      ([status, count]) => ({
        carStatus: status, // Keep status as string for comparison with enum
        carCount: count,
      })
    );

    formattedDataset.forEach((data: any) => {
      if (
        data.carStatus === "ENTERED" ||
        data.carStatus === "IN_PROGRESS" ||
        data.carStatus === "DONE"
      ) {
        carsBeingWorkedOnCount += data.carCount;
      } else if (data.carStatus === "GATEPASS_GENERATED") {
        gatePassGeneratedCount += data.carCount;
      }
    });

    const totalCars = carsBeingWorkedOnCount + gatePassGeneratedCount;
    const emptySpace = TOTAL_PARKING_SPACE - totalCars;

    //
    chartData[0].carsBeingWorkedOn = carsBeingWorkedOnCount;
    chartData[0].gatePassGenerated = gatePassGeneratedCount;
    chartData[0].empty = emptySpace;
  }, [tempCars]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Parking Space Utilized</CardTitle>
        <CardDescription>At Present</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={360}
            innerRadius={80}
            outerRadius={130}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {(
                            chartData[0].carsBeingWorkedOn +
                            chartData[0].gatePassGenerated
                          ).toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground"
                        >
                          Cars Parked / {TOTAL_PARKING_SPACE}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="carsBeingWorkedOn"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-carsBeingWorkedOn)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="gatePassGenerated"
              fill="var(--color-gatePassGenerated)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="empty"
              fill="var(--color-empty)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
