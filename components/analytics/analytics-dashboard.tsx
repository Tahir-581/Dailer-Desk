"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Clock, Users, CheckCircle, ArrowUpRight, TrendingUp } from "lucide-react";
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Line, 
  LineChart, 
  Pie, 
  PieChart, 
  XAxis, 
  YAxis,
  Label,
  Tooltip,
  Legend
} from "recharts";
import { 
  ChartConfig, 
  ChartContainer, 
  ChartLegend, 
  ChartLegendContent, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";

interface AnalyticsData {
  metrics: {
    totalCalls: number;
    answeredCalls: number;
    missedCalls: number;
    abandonedCalls: number;
    averageDuration: number;
    totalDuration: number;
    transferRate: number;
    completionRate: number;
    averageSentiment: number;
  };
  timeSeries: Array<{
    date: string;
    calls: number;
    answered: number;
    missed: number;
    abandoned: number;
    duration: number;
    avgDuration: number;
    avgLatency: number;
    transfers: number;
    sentiment: number;
    completed: number;
  }>;
  outcomes: Array<{
    outcome: string;
    count: number;
    percentage: number;
  }>;
  assistantPerformance: Array<{
    assistantId: string;
    assistantName: string;
    totalCalls: number;
    answeredCalls: number;
    averageDuration: number;
    transferRate: number;
    averageSentiment: number;
  }>;
  directionBreakdown: Array<{
    direction: 'inbound' | 'outbound';
    count: number;
    percentage: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    calls: number;
    answered: number;
    missed: number;
    abandoned: number;
  }>;
  durationDistribution: Array<{
    bucket: string;
    count: number;
    percentage: number;
  }>;
  sentimentDistribution: Array<{
    bucket: string;
    count: number;
    percentage: number;
  }>;
}

const timeSeriesConfig = {
  calls: {
    label: "Total Calls",
    color: "hsl(var(--chart-1))",
  },
  answered: {
    label: "Answered",
    color: "hsl(var(--chart-2))",
  },
  missed: {
    label: "Missed",
    color: "hsl(var(--chart-3))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-4))",
  },
  duration: {
    label: "Duration",
    color: "hsl(var(--chart-5))",
  },
  latency: {
    label: "Latency",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const outcomeConfig = {
  count: {
    label: "Calls",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  abandoned: {
    label: "Abandoned",
    color: "hsl(var(--chart-3))",
  },
  voicemail: {
    label: "Voicemail",
    color: "hsl(var(--chart-4))",
  },
  busy: {
    label: "Busy",
    color: "hsl(var(--chart-5))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--destructive))",
  },
  transferred: {
    label: "Transferred",
    color: "hsl(var(--chart-2))",
  },
  unknown: {
    label: "Unknown",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;

const successConfig = {
  successful: {
    label: "Successful",
    color: "hsl(var(--chart-2))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("7d");
  const [assistantFilter, setAssistantFilter] = useState("all");

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      params.append("startDate", startDate.toISOString());
      params.append("endDate", now.toISOString());
      
      if (assistantFilter !== "all") {
        params.append("assistantId", assistantFilter);
      }

      const response = await fetch(`/api/analytics?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, assistantFilter]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchAnalyticsData} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>No analytics data found for the selected filters.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { metrics, timeSeries, outcomes, assistantPerformance, directionBreakdown, hourlyActivity, durationDistribution, sentimentDistribution } = data;

  // Prepare data for outcome pie chart
  const outcomeData = outcomes.map(o => ({
    ...o,
    fill: outcomeConfig[o.outcome as keyof typeof outcomeConfig]?.color || "hsl(var(--chart-5))"
  }));

  // Prepare data for success pie chart (Chart 2)
  const successCount = outcomes.find(o => o.outcome === 'completed')?.count || 0;
  const failedCount = metrics.totalCalls - successCount;
  const successPieData = [
    { name: "successful", value: successCount, fill: successConfig.successful.color },
    { name: "failed", value: failedCount, fill: successConfig.failed.color },
  ];

  // Prepare data for Picked Up Rate (Chart 4)
  const pickupRateData = timeSeries.map(d => ({
    date: d.date,
    rate: d.calls > 0 ? (d.answered / d.calls) * 100 : 0
  }));

  // Prepare data for Success Rate (Chart 5)
  const successRateData = timeSeries.map(d => ({
    date: d.date,
    rate: d.calls > 0 ? (d.completed / d.calls) * 100 : 0
  }));

  // Prepare data for Stacked Bar (Chart 8 & 9)
  // We'll use timeSeries data which has daily breakdown of outcomes
  const stackedBarData = timeSeries.map(d => ({
    date: d.date,
    completed: d.completed,
    abandoned: d.abandoned,
    missed: d.missed,
    // Add other outcomes if available in timeSeries, otherwise we are limited to what getTimeSeriesData returns
    // Currently getTimeSeriesData returns: calls, answered, missed, abandoned, completed
    other: d.calls - (d.completed + d.abandoned + d.missed)
  }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Select value={assistantFilter} onValueChange={setAssistantFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Assistants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assistants</SelectItem>
                {assistantPerformance.map((assistant) => (
                  <SelectItem key={assistant.assistantId} value={assistant.assistantId}>
                    {assistant.assistantName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchAnalyticsData} variant="outline">
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.answeredCalls} answered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(metrics.averageDuration / 60)}m {metrics.averageDuration % 60}s</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transfer Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.transferRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. Call Counts (Area Chart) */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Call Counts</CardTitle>
            <CardDescription>Daily call volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={timeSeriesConfig} className="min-h-[300px] w-full">
              <AreaChart accessibilityLayer data={timeSeries}>
                <CartesianGrid vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis axisLine={false} tickLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Area dataKey="calls" type="natural" fill="var(--color-calls)" fillOpacity={0.4} stroke="var(--color-calls)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 2. Call Successful (Pie/Donut) */}
        <Card>
          <CardHeader>
            <CardTitle>Call Successful</CardTitle>
            <CardDescription>Success vs Failed</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={successConfig} className="mx-auto aspect-square max-h-[300px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie 
                  data={successPieData} 
                  dataKey="value" 
                  nameKey="name" 
                  innerRadius={60} 
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                              {metrics.completionRate}%
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                              Success
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 3. Disconnection Reason (Pie/Donut) */}
        <Card>
          <CardHeader>
            <CardTitle>Disconnection Reason</CardTitle>
            <CardDescription>Outcome breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={outcomeConfig} className="mx-auto aspect-square max-h-[300px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie 
                  data={outcomeData} 
                  dataKey="count" 
                  nameKey="outcome" 
                  innerRadius={60} 
                  strokeWidth={5} 
                />
                <ChartLegend content={<ChartLegendContent />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 4. Call Picked Up Rate (Area) */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader>
            <CardTitle>Call Picked Up Rate</CardTitle>
            <CardDescription>Percentage of calls answered</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ rate: { label: "Pickup Rate", color: "hsl(var(--chart-2))" } }} className="min-h-[250px] w-full">
              <AreaChart accessibilityLayer data={pickupRateData}>
                <CartesianGrid vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="rate" type="monotone" fill="var(--color-rate)" fillOpacity={0.4} stroke="var(--color-rate)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 5. Call Successful Rate (Area) */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader>
            <CardTitle>Call Successful Rate</CardTitle>
            <CardDescription>Percentage of calls completed</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ rate: { label: "Success Rate", color: "hsl(var(--chart-4))" } }} className="min-h-[250px] w-full">
              <AreaChart accessibilityLayer data={successRateData}>
                <CartesianGrid vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="rate" type="monotone" fill="var(--color-rate)" fillOpacity={0.4} stroke="var(--color-rate)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 6. Average Call Duration (Area) */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader>
            <CardTitle>Average Call Duration</CardTitle>
            <CardDescription>Seconds per call</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ avgDuration: { label: "Avg Duration (s)", color: "hsl(var(--chart-5))" } }} className="min-h-[250px] w-full">
              <AreaChart accessibilityLayer data={timeSeries}>
                <CartesianGrid vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis axisLine={false} tickLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="avgDuration" type="monotone" fill="var(--color-avgDuration)" fillOpacity={0.4} stroke="var(--color-avgDuration)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 7. Average Latency (Area) */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader>
            <CardTitle>Average Latency</CardTitle>
            <CardDescription>Network latency (ms)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ avgLatency: { label: "Latency (ms)", color: "hsl(var(--chart-1))" } }} className="min-h-[250px] w-full">
              <AreaChart accessibilityLayer data={timeSeries}>
                <CartesianGrid vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis axisLine={false} tickLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="avgLatency" type="monotone" fill="var(--color-avgLatency)" fillOpacity={0.4} stroke="var(--color-avgLatency)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 8. Call Successful (Bar - Stacked) */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader>
            <CardTitle>Call Successful (Daily)</CardTitle>
            <CardDescription>Successful vs Failed calls over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={successConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={stackedBarData}>
                <CartesianGrid vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                <Bar dataKey="completed" stackId="a" fill={successConfig.successful.color} radius={[0, 0, 4, 4]} />
                <Bar dataKey="missed" stackId="a" fill={successConfig.failed.color} radius={[4, 4, 0, 0]} />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 9. Disconnection Reason (Bar - Stacked) */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader>
            <CardTitle>Disconnection Reason (Daily)</CardTitle>
            <CardDescription>Outcomes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={outcomeConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={stackedBarData}>
                <CartesianGrid vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                <Bar dataKey="completed" stackId="a" fill={outcomeConfig.completed.color} />
                <Bar dataKey="abandoned" stackId="a" fill={outcomeConfig.abandoned.color} />
                <Bar dataKey="missed" stackId="a" fill={outcomeConfig.busy.color} />
                <Bar dataKey="other" stackId="a" fill={outcomeConfig.unknown.color} radius={[4, 4, 0, 0]} />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
