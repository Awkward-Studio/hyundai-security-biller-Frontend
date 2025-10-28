"use client";

import { } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

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

const chartConfig = {
  cases: {
    label: "Cases",
    color: "hsl(var(--chart-1))",
  },
  label: {
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig;

export function InsuranceCasesBar({ jobCards, currentSelectedTimeline }: any) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedTimeline, setSelectedTimeline] = useState<string>();

  // let top10Insurers = chartData
  //   .sort((a, b) => b.cases - a.cases) // Sort in descending order by visitors
  //   .slice(0, 10); // Get the top 10 entries

  useEffect(() => {
    let topInsurers: any = [];
    const filteredJobCards = jobCards.filter(
      (jobCard: JobCard) =>
        jobCard.insuranceDetails && jobCard.jobCardStatus > 4
    );

    filteredJobCards.forEach((jobCard: JobCard) => {
      const insuranceDetails = JSON.parse(jobCard.insuranceDetails);
      // console.log(insuranceDetails);
      const insuranceCompany = insuranceDetails.policyProvider;
      const index = topInsurers.findIndex(
        (insurer: any) => insurer.insuranceCompany === insuranceCompany
      );
      if (index === -1) {
        topInsurers.push({
          insuranceCompany,
          cases: 1,
        });
      } else {
        topInsurers[index].cases += 1;
      }
    });

    topInsurers = topInsurers.sort((a: any, b: any) => b.cases - a.cases);
    topInsurers = topInsurers.slice(0, 10);
    setChartData(topInsurers);
    // console.log(top10Insurers);

    manageTimelineChange({ currentSelectedTimeline, setSelectedTimeline });
  }, [jobCards, currentSelectedTimeline]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top {chartData.length} Insurance Partners</CardTitle>
        <CardDescription>{selectedTimeline}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="insuranceCompany"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              hide
            />
            <XAxis dataKey="cases" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="cases"
              layout="vertical"
              fill="var(--color-cases)"
              radius={4}
            >
              <LabelList
                dataKey="insuranceCompany"
                position="insideLeft"
                offset={8}
                className="fill-[--color-label]"
                fontSize={12}
              />
              <LabelList
                dataKey="cases"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
