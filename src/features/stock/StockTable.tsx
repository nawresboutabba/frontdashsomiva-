import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fmtMAD, fmtNum } from "@/utils/format";
import { useAuthStore } from "@/store/authStore";
import { can } from "@/utils/rbac";
import { StockEditModal } from "./StockEditModal";
import type { Piece } from "@/api/types";

export function StockTable({ pieces }: { pieces: Piece[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [category, setCategory] = useState<string>("__all");
  const [statusFilter, setStatusFilter] = useState<string>("__all");
  const [editing, setEditing] = useState<Piece | null>(null);
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = can.editStock(role);

  const categories = useMemo(
    () => Array.from(new Set(pieces.map((p) => p.categorie))).sort(),
    [pieces],
  );

  const filtered = useMemo(() => {
    return pieces.filter((p) => {
      if (category !== "__all" && p.categorie !== category) return false;
      if (statusFilter === "low" && p.stock >= p.stockMin) return false;
      if (statusFilter === "ok" && p.stock < p.stockMin) return false;
      return true;
    });
  }, [pieces, category, statusFilter]);

  const columns = useMemo<ColumnDef<Piece>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => (
          <SortBtn label="Code" onClick={() => column.toggleSorting()} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "designation",
        header: "Désignation",
        cell: ({ row }) => <span className="text-sm">{row.original.designation}</span>,
      },
      {
        accessorKey: "categorie",
        header: "Catégorie",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-[10px]">
            {row.original.categorie}
          </Badge>
        ),
      },
      {
        accessorKey: "stock",
        header: ({ column }) => (
          <SortBtn label="Stock" onClick={() => column.toggleSorting()} align="right" />
        ),
        cell: ({ row }) => {
          const p = row.original;
          const low = p.stock < p.stockMin;
          return (
            <div className="text-right font-mono text-sm">
              <span className={low ? "font-bold text-destructive" : ""}>
                {fmtNum(p.stock)}
              </span>
              <span className="ml-1 text-[10px] text-muted-foreground">{p.unite}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "stockMin",
        header: () => <div className="text-right">Min.</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-xs text-muted-foreground">
            {fmtNum(row.original.stockMin)}
          </div>
        ),
      },
      {
        accessorKey: "prixUnitaire",
        header: ({ column }) => (
          <SortBtn label="Prix unit." onClick={() => column.toggleSorting()} align="right" />
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono text-xs">
            {fmtMAD(row.original.prixUnitaire)}
          </div>
        ),
      },
      {
        id: "valeur",
        header: () => <div className="text-right">Valeur</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-xs font-semibold">
            {fmtMAD(row.original.stock * row.original.prixUnitaire)}
          </div>
        ),
      },
      {
        id: "status",
        header: "État",
        cell: ({ row }) => {
          const low = row.original.stock < row.original.stockMin;
          return (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold uppercase",
                low
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-success/40 bg-success/10 text-success",
              )}
            >
              {low ? "Alerte" : "OK"}
            </Badge>
          );
        },
      },
      ...(canEdit
        ? [
            {
              id: "actions",
              header: () => <div className="text-right">Actions</div>,
              cell: ({ row }: { row: { original: Piece } }) => (
                <div className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => setEditing(row.original)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              ),
            } as ColumnDef<Piece>,
          ]
        : []),
    ],
    [canEdit],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 w-64 pl-8 text-sm"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 w-48 text-sm">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Toutes catégories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="État" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Tous états</SelectItem>
            <SelectItem value="low">Sous minimum</SelectItem>
            <SelectItem value="ok">Stock OK</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-xs text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">{filtered.length}</span> pièces
          <span className="mx-2">·</span>
          <span className="font-mono font-semibold text-destructive">
            {filtered.filter((p) => p.stock < p.stockMin).length}
          </span>{" "}
          en alerte
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const low = row.original.stock < row.original.stockMin;
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border/60 transition-colors hover:bg-accent/40",
                    low && "bg-destructive/[0.04]",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Aucune pièce trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <div>
          Page{" "}
          <span className="font-mono font-semibold text-foreground">
            {table.getState().pagination.pageIndex + 1}
          </span>{" "}
          / {table.getPageCount() || 1}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <StockEditModal piece={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function SortBtn({
  label,
  onClick,
  align = "left",
}: {
  label: string;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground",
        align === "right" && "ml-auto",
      )}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );
}
