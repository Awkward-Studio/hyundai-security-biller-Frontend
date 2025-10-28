"use client";

import { } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
import { JobCard } from "@/lib/definitions";
import { manageTimelineChange } from "@/lib/helper";

// removed unused chartData

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  generalvisit: {
    label: "General Visit",
    color: "hsl(var(--chart-2))",
  },
  bodyshop: {
    label: "Bodyshop",
    color: "hsl(var(--chart-5))",
  },
  paidservice: {
    label: "Paid Service",
    color: "hsl(var(--chart-3))",
  },
  runningrepair: {
    label: "Running Repair",
    color: "hsl(var(--chart-4))",
  },
  closed: {
    label: "Closed Jobcards",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function CustomerSplit({
  jobCards,
  currentSelectedTimeline,
}: any) {
  const [newChartData, setNewChartData] = useState<any[]>([]);
  const [selectedTimeline, setSelectedTimeline] = useState<string>();

  useEffect(() => {
    const calculateVisitors = async () => {
      const closedJobCards = jobCards.filter(
        (jobCard: JobCard) => jobCard.jobCardStatus >= 6
      );
      const openJobCards = jobCards.filter(
        (jobCard: JobCard) => jobCard.jobCardStatus < 6
      );

      console.log("FILTERED", openJobCards);

      const groupedData = openJobCards.reduce((acc: any, curr: any) => {
        acc[curr.purposeOfVisit] = (acc[curr.purposeOfVisit] || 0) + 1;
        return acc;
      }, {});

      // Create the formatted dataset
      const formattedDataset = Object.keys(groupedData).map((key) => ({
        pov: key,
        visitors: groupedData[key],
        fill: `var(--color-${key.replace(/\s+/g, "").toLowerCase()})`,
      }));

      console.log("FORMATTED", formattedDataset);

      formattedDataset.push({
        pov: "Closed Jobcards",
        visitors: closedJobCards.length,
        fill: "var(--color-closed)",
      });

      setNewChartData(formattedDataset);

      manageTimelineChange({ currentSelectedTimeline, setSelectedTimeline });
    };

    calculateVisitors();
  }, [jobCards, currentSelectedTimeline]);

  // console.log("FORMATTED", formattedDataset);
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Total Jobcards Opened</CardTitle>
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
              dataKey="visitors"
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
                          className="fill-foreground text-3xl font-bold"
                        >
                          {jobCards.length}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Jobcards
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
