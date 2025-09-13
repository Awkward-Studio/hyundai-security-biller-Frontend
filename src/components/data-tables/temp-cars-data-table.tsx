"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";

import {
  CarStatus,
  updateTempCarById,
  updateTempCarField,
  type TempCarRecord,
} from "@/lib/appwrite";
import Link from "next/link";
import { purposeOfVisits } from "@/lib/helper";

/* =========================
   Status helpers (label + color)
   ========================= */
const statusLabel = (s: CarStatus) =>
  s === CarStatus.ENTERED
    ? "Entered"
    : s === CarStatus.IN_PROGRESS
    ? "In Progress"
    : s === CarStatus.DONE
    ? "Done"
    : s === CarStatus.GATEPASS_GENERATED
    ? "Gatepass Generated"
    : s === CarStatus.EXITED
    ? "Exited"
    : "Unknown";

const statusDotClass = (s: CarStatus) =>
  s === CarStatus.ENTERED
    ? "bg-[#0040c1]"
    : s === CarStatus.IN_PROGRESS
    ? "bg-[#1849a9]"
    : s === CarStatus.DONE
    ? "bg-[#065986]"
    : s === CarStatus.GATEPASS_GENERATED
    ? "bg-[#107569]"
    : s === CarStatus.EXITED
    ? "bg-[#099250]"
    : "bg-gray-400";

function StatusPill({ status }: { status: CarStatus }) {
  return (
    <div className="flex items-center px-4 py-2 rounded-full font-semibold space-x-3">
      <div className={`h-3.5 w-3.5 rounded-full ${statusDotClass(status)}`} />
      <span>{statusLabel(status)}</span>
    </div>
  );
}

const POV_CODE_TO_DESC = new Map<number, string>(
  purposeOfVisits.map((p) => [p.code, p.description])
);

// Reusable: codes (string[] | unknown) -> descriptions (string[])
export function mapPovCodesToDescriptions(codes: unknown): string[] {
  if (!Array.isArray(codes)) return [];
  return codes
    .map((c) => {
      const n = Number(c);
      return Number.isFinite(n)
        ? POV_CODE_TO_DESC.get(n) ?? String(c)
        : String(c);
    })
    .filter(Boolean) as string[];
}
/* =========================
   Row actions
   ========================= */
function SecurityRowActions({ tempCar }: { tempCar: TempCarRecord }) {
  const [loading, setLoading] = useState(false);
  const [inParking, setInParking] = useState<boolean>(!!tempCar.inParking);

  const canExit =
    tempCar.carStatus === CarStatus.GATEPASS_GENERATED && !inParking;

  const handleExit = async () => {
    if (!canExit) return;
    try {
      setLoading(true);
      await updateTempCarField(
        tempCar.$id as string,
        "carStatus",
        CarStatus.EXITED
      );
      await updateTempCarField(tempCar.$id as string, "redundant", true);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to mark as exited");
    } finally {
      setLoading(false);
    }
  };

  const sendToParking = async () => {
    try {
      setLoading(true);
      await updateTempCarField(tempCar.$id as string, "inParking", true);
      setInParking(true);
    } catch (e) {
      console.error(e);
      alert("Failed to send to parking");
    } finally {
      setLoading(false);
    }
  };

  const retrieveFromParking = async () => {
    try {
      setLoading(true);
      await updateTempCarField(tempCar.$id as string, "inParking", false);
      setInParking(false);
    } catch (e) {
      console.error(e);
      alert("Failed to retrieve from parking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 flex items-center gap-2">
      {/* Parking controls (security-only) */}
      {!inParking ? (
        <Button onClick={sendToParking} disabled={loading}>
          Send to Parking
        </Button>
      ) : (
        <Button onClick={retrieveFromParking} disabled={loading}>
          Retrieve from Parking
        </Button>
      )}

      {/* Exit (disabled if in parking, or not gatepass-ready) */}
      <Button
        className="bg-red-500 text-white"
        onClick={handleExit}
        disabled={loading || !canExit}
      >
        Exit Car
      </Button>
    </div>
  );
}

function BillerRowActions({ tempCar }: { tempCar: TempCarRecord }) {
  return (
    <div className="flex items-center gap-3">
      <div>
        <Link
          href={`/biller/tempCarId/${tempCar.$id}`}
          className="px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-sm font-medium"
        >
          View
        </Link>
      </div>
    </div>
  );
}

function RowActions({ tempCar }: { tempCar: TempCarRecord }) {
  let userAccess = "";
  try {
    const token = getCookie("user");
    if (token) {
      const parsed = JSON.parse(String(token));
      userAccess = parsed?.labels?.[0] ?? "";
    }
  } catch {}

  if (userAccess === "security")
    return <SecurityRowActions tempCar={tempCar} />;
  if (userAccess === "biller") return <BillerRowActions tempCar={tempCar} />;
  return null;
}

/* =========================
   Columns (with Status pill)
   ========================= */
export const tempCarsColumns: ColumnDef<TempCarRecord>[] = [
  {
    accessorKey: "carNumber",
    header: "Car Number",
  },
  {
    accessorKey: "carMake",
    header: "Car Make / Model",
    cell: ({ row }) => {
      const tc = row.original;
      return (
        <div className="flex flex-col items-start">
          <div>{tc.carMake}</div>
          <div className="text-sm text-muted-foreground">{tc.carModel}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "purposesOfVisit",
    header: "Purpose(s)",
    cell: ({ row }) => {
      const descriptions = mapPovCodesToDescriptions(
        row.original.purposesOfVisit
      );
      return descriptions.length > 0 ? descriptions.join(", ") : "No POV";
    },
    // Accepts either a code ("1") or a description ("Quick Wash")
    filterFn: (row, columnId, filterValue) => {
      const codes = (row.getValue<string[]>(columnId) ?? []).map(String);
      const descs = mapPovCodesToDescriptions(codes);
      const q = String(filterValue);
      return codes.includes(q) || descs.includes(q);
    },
  },
  {
    accessorKey: "carStatus",
    header: "Status",
    cell: ({ row }) => <StatusPill status={row.original.carStatus} />,
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      const val = String(row.getValue(columnId));
      return val === String(filterValue);
    },
  },
];

/* =========================
   Data table with Status filter
   ========================= */
interface DataTableProps {
  columns: ColumnDef<TempCarRecord, any>[];
  data: TempCarRecord[];
  povCategories?: string[];
}

export function TempCarsDataTable({
  columns,
  data,
  povCategories,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  useEffect(() => {
    table
      .getColumn("carStatus")
      ?.setFilterValue(statusFilter === "ALL" ? undefined : statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div>
      <div className="flex flex-col items-start py-4 justify-between space-y-5">
        <div className="flex justify-between items-center w-full">
          <div>
            <Input
              placeholder="Search by Car Number"
              value={
                (table.getColumn("carNumber")?.getFilterValue() as string) ?? ""
              }
              onChange={(e) =>
                table.getColumn("carNumber")?.setFilterValue(e.target.value)
              }
              className="max-w-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {povCategories && (
              <Select
                onValueChange={(value) =>
                  table.getColumn("purposesOfVisit")?.setFilterValue(value)
                }
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Purpose of Visit" />
                </SelectTrigger>
                <SelectContent>
                  {povCategories.filter(Boolean).map((pov) => (
                    <SelectItem key={pov} value={pov}>
                      {pov}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v)}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Status (All)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value={String(CarStatus.ENTERED)}>
                  Entered
                </SelectItem>
                <SelectItem value={String(CarStatus.IN_PROGRESS)}>
                  In Progress
                </SelectItem>
                <SelectItem value={String(CarStatus.DONE)}>Done</SelectItem>
                <SelectItem value={String(CarStatus.GATEPASS_GENERATED)}>
                  Gatepass Generated
                </SelectItem>
                <SelectItem value={String(CarStatus.EXITED)}>Exited</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
                <TableHead /> {/* actions column spacer */}
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

                  {/* Actions */}
                  <TableCell>
                    <RowActions tempCar={row.original as TempCarRecord} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
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
  );
}
