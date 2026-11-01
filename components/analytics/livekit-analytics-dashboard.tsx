"use client";

import * as React from "react";
import {
  BarChart3Icon,
  CalendarIcon,
  SignalIcon,
  UsersIcon,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const analyticsSeries = [
  { date: "2026-01-16", calls: 128, completed: 116, transferred: 14, avgDurationSec: 204, avgLatencyMs: 820, sentiment: 0.72 },
  { date: "2026-01-17", calls: 142, completed: 130, transferred: 18, avgDurationSec: 218, avgLatencyMs: 840, sentiment: 0.7 },
  { date: "2026-01-18", calls: 156, completed: 142, transferred: 20, avgDurationSec: 232, avgLatencyMs: 860, sentiment: 0.69 },
  { date: "2026-01-19", calls: 148, completed: 134, transferred: 16, avgDurationSec: 226, avgLatencyMs: 810, sentiment: 0.73 },
  { date: "2026-01-20", calls: 165, completed: 151, transferred: 22, avgDurationSec: 241, avgLatencyMs: 880, sentiment: 0.71 },
  { date: "2026-01-21", calls: 172, completed: 158, transferred: 21, avgDurationSec: 236, avgLatencyMs: 860, sentiment: 0.74 },
  { date: "2026-01-22", calls: 161, completed: 148, transferred: 19, avgDurationSec: 229, avgLatencyMs: 850, sentiment: 0.76 },
  { date: "2026-01-23", calls: 174, completed: 160, transferred: 23, avgDurationSec: 245, avgLatencyMs: 900, sentiment: 0.68 },
  { date: "2026-01-24", calls: 188, completed: 174, transferred: 26, avgDurationSec: 252, avgLatencyMs: 920, sentiment: 0.66 },
  { date: "2026-01-25", calls: 193, completed: 181, transferred: 24, avgDurationSec: 248, avgLatencyMs: 890, sentiment: 0.69 },
  { date: "2026-01-26", calls: 179, completed: 165, transferred: 21, avgDurationSec: 234, avgLatencyMs: 860, sentiment: 0.71 },
  { date: "2026-01-27", calls: 166, completed: 151, transferred: 18, avgDurationSec: 221, avgLatencyMs: 830, sentiment: 0.73 },
  { date: "2026-01-28", calls: 171, completed: 156, transferred: 20, avgDurationSec: 228, avgLatencyMs: 840, sentiment: 0.72 },
  { date: "2026-01-29", calls: 184, completed: 170, transferred: 22, avgDurationSec: 238, avgLatencyMs: 880, sentiment: 0.7 },
  { date: "2026-01-30", calls: 197, completed: 184, transferred: 25, avgDurationSec: 246, avgLatencyMs: 900, sentiment: 0.68 },
  { date: "2026-01-31", calls: 189, completed: 176, transferred: 23, avgDurationSec: 242, avgLatencyMs: 890, sentiment: 0.7 },
  { date: "2026-02-01", calls: 176, completed: 163, transferred: 21, avgDurationSec: 231, avgLatencyMs: 860, sentiment: 0.73 },
  { date: "2026-02-02", calls: 168, completed: 155, transferred: 19, avgDurationSec: 224, avgLatencyMs: 840, sentiment: 0.74 },
  { date: "2026-02-03", calls: 182, completed: 169, transferred: 22, avgDurationSec: 237, avgLatencyMs: 870, sentiment: 0.72 },
  { date: "2026-02-04", calls: 195, completed: 182, transferred: 24, avgDurationSec: 251, avgLatencyMs: 910, sentiment: 0.69 },
  { date: "2026-02-05", calls: 203, completed: 189, transferred: 27, avgDurationSec: 258, avgLatencyMs: 930, sentiment: 0.67 },
  { date: "2026-02-06", calls: 188, completed: 175, transferred: 22, avgDurationSec: 243, avgLatencyMs: 900, sentiment: 0.7 },
  { date: "2026-02-07", calls: 174, completed: 161, transferred: 20, avgDurationSec: 232, avgLatencyMs: 860, sentiment: 0.72 },
  { date: "2026-02-08", calls: 162, completed: 149, transferred: 18, avgDurationSec: 220, avgLatencyMs: 830, sentiment: 0.73 },
  { date: "2026-02-09", calls: 170, completed: 157, transferred: 19, avgDurationSec: 228, avgLatencyMs: 840, sentiment: 0.71 },
  { date: "2026-02-10", calls: 181, completed: 168, transferred: 22, avgDurationSec: 235, avgLatencyMs: 870, sentiment: 0.7 },
  { date: "2026-02-11", calls: 192, completed: 179, transferred: 24, avgDurationSec: 246, avgLatencyMs: 900, sentiment: 0.69 },
  { date: "2026-02-12", calls: 205, completed: 191, transferred: 26, avgDurationSec: 259, avgLatencyMs: 940, sentiment: 0.68 },
  { date: "2026-02-13", calls: 198, completed: 185, transferred: 25, avgDurationSec: 252, avgLatencyMs: 920, sentiment: 0.69 },
  { date: "2026-02-14", calls: 187, completed: 173, transferred: 23, avgDurationSec: 244, avgLatencyMs: 900, sentiment: 0.71 },
];

const agents = [
  { id: "all", name: "All agents" },
  { id: "sales", name: "Sales agent" },
  { id: "support", name: "Support agent" },
  { id: "collections", name: "Collections agent" },
];

const agentWeight: Record<string, number> = {
  all: 1,
  sales: 0.52,
  support: 0.33,
  collections: 0.22,
};

const topIntents = [
  { name: "Schedule demo", share: 0.22, successRate: 0.91, avgDurationSec: 208 },
  { name: "Pricing question", share: 0.18, successRate: 0.88, avgDurationSec: 192 },
  { name: "Reset password", share: 0.15, successRate: 0.94, avgDurationSec: 146 },
  { name: "Order status", share: 0.14, successRate: 0.9, avgDurationSec: 171 },
  { name: "Upgrade plan", share: 0.12, successRate: 0.86, avgDurationSec: 214 },
  { name: "Cancel subscription", share: 0.09, successRate: 0.83, avgDurationSec: 238 },
  { name: "Other", share: 0.1, successRate: 0.78, avgDurationSec: 164 },
];

const outcomeBreakdown = [
  { outcome: "Completed", share: 0.72 },
  { outcome: "Transferred", share: 0.14 },
  { outcome: "Voicemail", share: 0.08 },
  { outcome: "Dropped", share: 0.06 },
];

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}m ${remaining}s`;
}

function formatLatency(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function clampDateRange(start: string, end: string) {
  if (!start || !end) return { start, end };
  if (new Date(start) > new Date(end)) {
    return { start: end, end: start };
  }
  return { start, end };
}

export function LiveKitAnalyticsDashboard() {
  const defaultRange = getDefaultDateRange();
  const [start, setStart] = React.useState(defaultRange.start);
  const [end, setEnd] = React.useState(defaultRange.end);
  const [agentId, setAgentId] = React.useState("all");

  const normalizedRange = React.useMemo(() => clampDateRange(start, end), [start, end]);

  const filteredSeries = React.useMemo(() => {
    const startDate = new Date(normalizedRange.start);
    const endDate = new Date(normalizedRange.end);
    const weight = agentWeight[agentId] ?? 1;
    const durationMultiplier = agentId === "sales" ? 1.08 : agentId === "support" ? 0.92 : agentId === "collections" ? 1.15 : 1;
    const latencyMultiplier = agentId === "sales" ? 0.96 : agentId === "support" ? 0.9 : agentId === "collections" ? 1.05 : 1;
    const sentimentShift = agentId === "sales" ? 0.02 : agentId === "support" ? 0.03 : agentId === "collections" ? -0.04 : 0;

    return analyticsSeries
      .filter((item) => {
        const date = new Date(item.date);
        return date >= startDate && date <= endDate;
      })
      .map((item) => ({
        ...item,
        calls: Math.max(0, Math.round(item.calls * weight)),
        completed: Math.max(0, Math.round(item.completed * weight)),
        transferred: Math.max(0, Math.round(item.transferred * weight)),
        avgDurationSec: Math.max(60, Math.round(item.avgDurationSec * durationMultiplier)),
        avgLatencyMs: Math.max(300, Math.round(item.avgLatencyMs * latencyMultiplier)),
        sentiment: Math.min(0.95, Math.max(0.4, item.sentiment + sentimentShift)),
      }));
  }, [agentId, normalizedRange.end, normalizedRange.start]);

  const summary = React.useMemo(() => {
    if (filteredSeries.length === 0) {
      return {
        totalCalls: 0,
        completionRate: 0,
        transferRate: 0,
        avgDurationSec: 0,
        avgLatencyMs: 0,
        sentiment: 0,
        peakCalls: 0,
      };
    }
    const totalCalls = filteredSeries.reduce((sum, item) => sum + item.calls, 0);
    const totalCompleted = filteredSeries.reduce((sum, item) => sum + item.completed, 0);
    const totalTransferred = filteredSeries.reduce((sum, item) => sum + item.transferred, 0);
    const avgDurationSec =
      filteredSeries.reduce((sum, item) => sum + item.avgDurationSec, 0) / filteredSeries.length;
    const avgLatencyMs =
      filteredSeries.reduce((sum, item) => sum + item.avgLatencyMs, 0) / filteredSeries.length;
    const sentiment = filteredSeries.reduce((sum, item) => sum + item.sentiment, 0) / filteredSeries.length;
    const peakCalls = Math.max(...filteredSeries.map((item) => item.calls));

    return {
      totalCalls,
      completionRate: totalCalls ? totalCompleted / totalCalls : 0,
      transferRate: totalCalls ? totalTransferred / totalCalls : 0,
      avgDurationSec,
      avgLatencyMs,
      sentiment,
      peakCalls,
    };
  }, [filteredSeries]);

  const volumeConfig = {
    calls: { label: "Calls", color: "hsl(var(--chart-1))" },
    completed: { label: "Completed", color: "hsl(var(--chart-2))" },
  } satisfies ChartConfig;

  const durationConfig = {
    avgDurationSec: { label: "Avg duration", color: "hsl(var(--chart-3))" },
  } satisfies ChartConfig;

  const sentimentConfig = {
    sentiment: { label: "Sentiment score", color: "hsl(var(--chart-4))" },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Manual analytics modeled after Retell AI insights for call performance and quality.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="analytics-start">Start date</Label>
          <Input
            id="analytics-start"
            type="date"
            value={normalizedRange.start}
            onChange={(e) => setStart(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="analytics-end">End date</Label>
          <Input
            id="analytics-end"
            type="date"
            value={normalizedRange.end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Agent</Label>
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="@xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total calls</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              {summary.totalCalls.toLocaleString()}
              <BarChart3Icon className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion rate</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              {formatPercent(summary.completionRate)}
              <SignalIcon className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Transfer rate</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              {formatPercent(summary.transferRate)}
              <UsersIcon className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg call duration</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              {summary.avgDurationSec ? formatDuration(summary.avgDurationSec) : "—"}
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg latency</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {summary.avgLatencyMs ? formatLatency(summary.avgLatencyMs) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sentiment score</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {summary.sentiment ? summary.sentiment.toFixed(2) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Call volume</CardTitle>
            <CardDescription>
              Completed calls vs total calls for the selected range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={volumeConfig} className="h-[260px] w-full">
              <AreaChart data={filteredSeries}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  }
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="calls"
                  stroke="var(--color-calls)"
                  fill="var(--color-calls)"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="var(--color-completed)"
                  fill="var(--color-completed)"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outcome mix</CardTitle>
            <CardDescription>Distribution of recent call outcomes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {outcomeBreakdown.map((outcome) => (
              <div key={outcome.outcome} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{outcome.outcome}</span>
                <Badge variant="outline">{formatPercent(outcome.share)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average call duration</CardTitle>
            <CardDescription>Trend of average handle time.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={durationConfig} className="h-[220px] w-full">
              <AreaChart data={filteredSeries}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  }
                />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Area
                  type="monotone"
                  dataKey="avgDurationSec"
                  name="Avg duration"
                  stroke="var(--color-duration)"
                  fill="var(--color-duration)"
                  fillOpacity={0.25}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sentiment trend</CardTitle>
            <CardDescription>Average sentiment per day.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={sentimentConfig} className="h-[220px] w-full">
              <AreaChart data={filteredSeries}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  }
                />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Area
                  type="monotone"
                  dataKey="sentiment"
                  name="Sentiment"
                  stroke="var(--color-sentiment)"
                  fill="var(--color-sentiment)"
                  fillOpacity={0.25}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top intents</CardTitle>
            <CardDescription>Most common intents and performance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intent</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                    <TableHead className="text-right">Success rate</TableHead>
                    <TableHead className="text-right">Avg duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topIntents.map((intent) => (
                    <TableRow key={intent.name}>
                      <TableCell className="font-medium">{intent.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(intent.share)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(intent.successRate)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatDuration(intent.avgDurationSec)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quality highlights</CardTitle>
            <CardDescription>Summary of key performance markers.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Peak daily calls</p>
                <p className="text-xs text-muted-foreground">Highest volume in selected range</p>
              </div>
              <Badge variant="secondary">{summary.peakCalls.toLocaleString()}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Avg latency</p>
                <p className="text-xs text-muted-foreground">Agent to user response latency</p>
              </div>
              <Badge variant="secondary">{summary.avgLatencyMs ? formatLatency(summary.avgLatencyMs) : "—"}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Sentiment index</p>
                <p className="text-xs text-muted-foreground">Scaled from 0.4 to 0.95</p>
              </div>
              <Badge variant="secondary">{summary.sentiment ? summary.sentiment.toFixed(2) : "—"}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
