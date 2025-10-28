"use client";

import React, { useState, useEffect } from "react";
import { } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { JobCard } from "@/lib/definitions";
import { createJobCardObjReport, manageTimelineChange } from "@/lib/helper";
import { } from "react-datepicker/dist/date_utils";
import Decimal from "decimal.js";

const chartConfig = {
  revenue: {
    label: "Visitors",
  },
  generalvisit: {
    label: "General Visit",
    color: "hsl(var(--chart-2))",
  },
  bodyshop: {
    label: "Bodyshop",
    color: "hsl(var(--chart-1))",
  },
  paidservice: {
    label: "Paid Service",
    color: "hsl(var(--chart-3))",
  },
  runningrepair: {
    label: "Running Repair",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export default function RevenueSplit({
  jobCards,
  currentSelectedTimeline,
}: any) {
  const [newChartData, setNewChartData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const [selectedTimeline, setSelectedTimeline] = useState<string>();

  useEffect(() => {
    const refreshData = async () => {
      const filteredJobCards = jobCards.filter(
        (jobCard: JobCard) => jobCard.jobCardStatus >= 6
      );

      const tempReturnObj: any = {};

      let totalPartsWithoutTax = new Decimal(0);
      let totalLabourWithoutTax = new Decimal(0);
      let totalRevenue = new Decimal(0);

      await Promise.all(
        filteredJobCards.map(async (jobCard: JobCard) => {
          let jobCardParts = new Decimal(0);
          let jobCardLabour = new Decimal(0);
          let jobCardRevenue = new Decimal(0);

          const jobCardTotals = await createJobCardObjReport(jobCard);

          jobCardParts = jobCardParts.add(
            new Decimal(Number(jobCardTotals.partsSubtotal))
          );

          jobCardLabour = jobCardLabour.add(
            new Decimal(Number(jobCardTotals.labourSubtotal))
          );

          jobCardParts = jobCardParts.minus(
            new Decimal(Number(jobCardTotals.partsDiscount))
          );

          jobCardLabour = jobCardLabour.minus(
            new Decimal(Number(jobCardTotals.labourDiscount))
          );

          jobCardRevenue = jobCardRevenue.add(jobCardParts);
          jobCardRevenue = jobCardRevenue.add(jobCardLabour);

          totalPartsWithoutTax = totalPartsWithoutTax.add(jobCardParts);
          totalLabourWithoutTax = totalLabourWithoutTax.add(jobCardLabour);
          totalRevenue = totalRevenue.add(jobCardRevenue);

          if (!tempReturnObj[jobCard.purposeOfVisit]) {
            tempReturnObj[jobCard.purposeOfVisit] = {
              revenue: 0,
              fill: `var(--color-${jobCard.purposeOfVisit
                .replace(/\s+/g, "")
                .toLowerCase()})`,
            };
          } else {
            tempReturnObj[jobCard.purposeOfVisit].revenue = Number(
              new Decimal(tempReturnObj[jobCard.purposeOfVisit].revenue).add(
                jobCardRevenue
              )
            );
          }
        })
      );

      console.log("tempReturnObj", tempReturnObj);

      // Create the formatted dataset
      const formattedDataset = Object.entries(tempReturnObj).map(
        ([key]) => ({
          pov: key,
          revenue: Number(tempReturnObj[key].revenue.toFixed(2)), // Round off to 2 decimal places
          fill: tempReturnObj[key].fill,
        })
      );

      setTotal(Number(totalRevenue));

      setNewChartData(formattedDataset);
    };

    refreshData();

    manageTimelineChange({ currentSelectedTimeline, setSelectedTimeline });
  }, [jobCards, currentSelectedTimeline]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Total Revenue</CardTitle>
        <CardDescription>{selectedTimeline}</CardDescription>
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
            <Pie
              data={newChartData}
              dataKey="revenue"
              nameKey="pov"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-xl font-bold"
                        >
                          &#8377;{Math.round(total).toLocaleString("en-IN")}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
