"use client";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
import { JobCard } from "@/lib/definitions";
import { manageTimelineChange } from "@/lib/helper";

// Define colors for pie chart segments
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28DD9",
  "#FF6B6B",
  "#4ECDC4",
  "#FF9F1C",
  "#7D80DA",
  "#F25F5C",
];

const chartConfig = {
  cases: {
    label: "Cases",
    color: "hsl(var(--chart-1))",
  },
  label: {
    color: "hsl(var(--foreground))",
  },
} satisfies ChartConfig;

export function InsuranceCasesPie({ jobCards, currentSelectedTimeline }: any) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedTimeline, setSelectedTimeline] = useState<string>();

  useEffect(() => {
    let topInsurers: any = [];
    const filteredJobCards = jobCards.filter(
      (jobCard: JobCard) =>
        jobCard.insuranceDetails && jobCard.jobCardStatus > 4
    );

    filteredJobCards.forEach((jobCard: JobCard) => {
      const insuranceDetails = JSON.parse(jobCard.insuranceDetails);
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

    // Calculate total cases for percentage calculation
    const totalCases = topInsurers.reduce(
      (sum: number, item: any) => sum + item.cases,
      0
    );

    // Sort and limit to top 10
    topInsurers = topInsurers.sort((a: any, b: any) => b.cases - a.cases);
    topInsurers = topInsurers.slice(0, 10);

    // Add percentage information
    topInsurers = topInsurers.map((insurer: any) => ({
      ...insurer,
      percentage: ((insurer.cases / totalCases) * 100).toFixed(1),
    }));

    setChartData(topInsurers);
    manageTimelineChange({ currentSelectedTimeline, setSelectedTimeline });
  }, [jobCards, currentSelectedTimeline]);

  // Custom renderer for the legend items to truncate long names
  const renderLegend = (props: any) => {
    const { payload } = props;

    return (
      <ul className="flex flex-col gap-2 mt-4 text-sm">
        {payload.map((entry: any, index: number) => {
          const companyName = entry.payload.insuranceCompany;
          // Truncate long company names
          const displayName =
            companyName.length > 25
              ? companyName.substring(0, 25) + "..."
              : companyName;

          return (
            <li key={`item-${index}`} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-foreground">{displayName}</span>
              <span className="ml-auto font-medium">
                {entry.payload.cases} ({entry.payload.percentage}%)
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border rounded-lg shadow-md p-3">
          <p className="font-medium mb-1">{data.insuranceCompany}</p>
          <p className="text-sm">
            <span className="text-muted-foreground">Cases: </span>
            <span className="font-medium">{data.cases}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Percentage: </span>
            <span className="font-medium">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top {chartData.length} Insurance Partners</CardTitle>
        <CardDescription>{selectedTimeline}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="cases"
                nameKey="insuranceCompany"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {/* <Legend content={renderLegend} /> */}
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
