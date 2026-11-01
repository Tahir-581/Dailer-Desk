"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Play,
  FileText,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type CallSession = {
  id: string;
  direction: "inbound" | "outbound";
  callerNumber: string;
  calleeNumber: string;
  startTime: string;
  duration: number;
  outcome: string;
  recordingUrl: string;
  sentimentScore: number;
  transcript?: string;
  analysis?: any;
};

export function SessionHistoryTable() {
  const [data, setData] = React.useState<CallSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = React.useState(0);

  const fetchSessions = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.pageIndex.toString(),
        limit: pagination.pageSize.toString(),
      });
      
      // Add filters from columnFilters if needed
      
      const response = await fetch(`/api/analytics/sessions?${params}`);
      const result = await response.json();
      
      setData(result.sessions);
      setPageCount(result.pagination.pages);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize]);

  React.useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const columns: ColumnDef<CallSession>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "direction",
      header: "Direction",
      cell: ({ row }) => {
        const direction = row.getValue("direction") as string;
        return (
          <Badge variant={direction === "inbound" ? "default" : "secondary"}>
            {direction}
          </Badge>
        );
      },
    },
    {
      accessorKey: "startTime",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("startTime"));
        return <div>{date.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</div>;
      },
    },
    {
      accessorKey: "callerNumber",
      header: "Caller",
      cell: ({ row }) => <div>{row.getValue("callerNumber")}</div>,
    },
    {
      accessorKey: "calleeNumber",
      header: "Callee",
      cell: ({ row }) => <div>{row.getValue("calleeNumber")}</div>,
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => {
        const duration = row.getValue("duration") as number;
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        return <div>{mins}m {secs}s</div>;
      },
    },
    {
      accessorKey: "outcome",
      header: "Outcome",
      cell: ({ row }) => {
        const outcome = row.getValue("outcome") as string;
        return (
          <Badge variant="outline" className="capitalize">
            {outcome}
          </Badge>
        );
      },
    },
    {
      accessorKey: "sentimentScore",
      header: "Sentiment",
      cell: ({ row }) => {
        const score = row.getValue("sentimentScore") as number | null;
        if (score === null) return <span>-</span>;
        
        let color = "text-yellow-500";
        if (score > 0.3) color = "text-green-500";
        if (score < -0.3) color = "text-red-500";
        
        return <span className={`font-medium ${color}`}>{score.toFixed(2)}</span>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const session = row.original;
        return (
          <SessionDetailsSheet session={session} />
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter numbers..."
          value={(table.getColumn("callerNumber")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("callerNumber")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function SessionDetailsSheet({ session }: { session: CallSession }) {
  const [details, setDetails] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchDetails = async () => {
    if (details) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/sessions/${session.id}`);
      const data = await res.json();
      setDetails(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" onClick={fetchDetails}>
          View
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Session Details</SheetTitle>
        </SheetHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : details ? (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <p className="font-medium capitalize">{details.outcome}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Duration</span>
                <p className="font-medium">{details.duration}s</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Caller</span>
                <p className="font-medium">{details.callerNumber}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Callee</span>
                <p className="font-medium">{details.calleeNumber}</p>
              </div>
            </div>

            {details.recordingSignedUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Play className="h-4 w-4" /> Recording
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <audio controls className="w-full" src={details.recordingSignedUrl} />
                </CardContent>
              </Card>
            )}

            {details.analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {details.analysis.summary && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Summary</h4>
                      <p className="text-sm">{details.analysis.summary}</p>
                    </div>
                  )}
                  {details.analysis.actionItems && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Action Items</h4>
                      <p className="text-sm whitespace-pre-line">{details.analysis.actionItems}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {details.transcript && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {details.transcript}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load details
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
