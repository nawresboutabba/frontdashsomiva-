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
  Trash2,
  Plus,
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
import { useAuthStore } from "@/store/authStore";
import { can } from "@/utils/rbac";
import { EquipementFormModal } from "./EquipementFormModal";
import type { EquipementResponse, EquipementTreeData } from "@/api/endpoints/equipements";

const STATUS_BADGE: Record<string, string> = {
  EN_SERVICE: "bg-success/15 text-success border-success/30",
  EN_MAINTENANCE: "bg-warning/15 text-warning border-warning/30",
  EN_ARRET: "bg-destructive/15 text-destructive border-destructive/30",
};

interface EquipementTableProps {
  equipements: EquipementResponse[];
  treeData?: EquipementTreeData;
  isLoading?: boolean;
  onRefresh?: () => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
  showAddButton?: boolean;
}

export function EquipementTable({
  equipements,
  treeData,
  isLoading = false,
  onRefresh,
  onDelete,
  onAdd,
  showAddButton = true,
}: EquipementTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("__all");
  const [editingEquipement, setEditingEquipement] = useState<EquipementResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const role = useAuthStore((s) => s.user?.role);
  const canEdit = can.editEquipement(role);
  const canDelete = can.deleteEquipement(role);
  const canCreate = can.createEquipement(role);
  const equipementMap = useMemo(
    () => new Map(equipements.map((equipement) => [equipement.id, equipement])),
    [equipements],
  );

  const statuses = useMemo(
    () => Array.from(new Set(equipements.map((e) => e.statut))).sort(),
    [equipements],
  );

  type TableRow = {
    id: string;
    equipementId: string;
    equipement?: EquipementResponse;
    code: string;
    designation: string;
    localisation: string;
    fabricant?: string;
    statut: EquipementResponse["statut"];
    categorie: string;
    sousCategorie: string;
    taille: string;
    repere: string;
    piece: string;
    stock: string;
  };

  const hierarchyRows = useMemo<TableRow[]>(() => {
    if (!treeData) {
      return equipements.map((equipement) => ({
        id: equipement.id,
        equipementId: equipement.id,
        equipement,
        code: equipement.code,
        designation: equipement.designation,
        localisation: equipement.localisation,
        fabricant: equipement.fabricant,
        statut: equipement.statut,
        categorie: equipement.categorie?.nom ?? "-",
        sousCategorie: equipement.sousCategorie?.nom ?? "-",
        taille: equipement.taille?.label ?? "-",
        repere: equipement.repere?.code ?? "-",
        piece:
          equipement.pieces?.map((piece) => piece.designation).join(", ") || "-",
        stock: "-",
      }));
    }

    const rows: TableRow[] = [];

    for (const equipement of treeData.equipements) {
      const detailedEquipement = equipementMap.get(equipement.id);
      const categories = treeData.categories.filter((category) => category.equipementId === equipement.id);

      for (const category of categories) {
        const sousCategories = treeData.sousCategories.filter(
          (sousCategory) => sousCategory.categorieId === category.id,
        );

        for (const sousCategory of sousCategories) {
          const tailles = treeData.tailles.filter((taille) => taille.sousCategorieId === sousCategory.id);

          for (const taille of tailles) {
            const reperes = treeData.reperes.filter((repere) => repere.tailleId === taille.id);

            for (const repere of reperes) {
              const pieces = treeData.pieces.filter((piece) => piece.repereId === repere.id);

              if (!pieces.length) {
                rows.push({
                  id: `${equipement.id}-${category.id}-${sousCategory.id}-${taille.id}-${repere.id}`,
                  equipementId: equipement.id,
                  equipement: detailedEquipement,
                  code: equipement.code,
                  designation: equipement.nom,
                  localisation: equipement.localisation,
                  fabricant: detailedEquipement?.fabricant,
                  statut: equipement.statut,
                  categorie: category.nom,
                  sousCategorie: sousCategory.nom,
                  taille: taille.label,
                  repere: repere.code,
                  piece: "-",
                  stock: "-",
                });
                continue;
              }

              for (const piece of pieces) {
                rows.push({
                  id: `${equipement.id}-${repere.id}-${piece.id}`,
                  equipementId: equipement.id,
                  equipement: detailedEquipement,
                  code: equipement.code,
                  designation: equipement.nom,
                  localisation: equipement.localisation,
                  fabricant: detailedEquipement?.fabricant,
                  statut: equipement.statut,
                  categorie: category.nom,
                  sousCategorie: sousCategory.nom,
                  taille: taille.label,
                  repere: repere.code,
                  piece: piece.designation,
                  stock: `${piece.stock} ${piece.unite}`,
                });
              }
            }
          }
        }
      }
    }

    return rows;
  }, [equipements, equipementMap, treeData]);

  const filtered = useMemo(() => {
    return hierarchyRows.filter((e) => {
      if (globalFilter) {
        const q = globalFilter.toLowerCase();
        if (
          !e.code.toLowerCase().includes(q) &&
          !e.designation.toLowerCase().includes(q) &&
          !e.localisation.toLowerCase().includes(q) &&
          !e.categorie.toLowerCase().includes(q) &&
          !e.sousCategorie.toLowerCase().includes(q) &&
          !e.taille.toLowerCase().includes(q) &&
          !e.repere.toLowerCase().includes(q) &&
          !e.piece.toLowerCase().includes(q) &&
          !(e.fabricant?.toLowerCase().includes(q) ?? false)
        ) {
          return false;
        }
      }
      if (statusFilter !== "__all" && e.statut !== statusFilter) return false;
      return true;
    });
  }, [hierarchyRows, globalFilter, statusFilter]);

  const columns = useMemo<ColumnDef<TableRow>[]>(
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
        header: "Équipement",
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <div className="text-sm font-medium">{row.original.designation}</div>
            <div className="text-xs text-muted-foreground">{row.original.localisation}</div>
          </div>
        ),
      },
      {
        accessorKey: "categorie",
        header: "Catégorie",
      },
      {
        accessorKey: "sousCategorie",
        header: "Sous-catégorie",
      },
      {
        accessorKey: "taille",
        header: "Taille",
      },
      {
        accessorKey: "repere",
        header: "Repère",
      },
      {
        accessorKey: "piece",
        header: "Pièce",
        cell: ({ row }) => <span className="text-sm">{row.original.piece}</span>,
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.stock}</span>
        ),
      },
      {
        accessorKey: "fabricant",
        header: "Fabricant",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.fabricant || "-"}
          </span>
        ),
      },
      {
        accessorKey: "statut",
        header: "Statut",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn("text-[10px] font-semibold", STATUS_BADGE[row.original.statut])}
          >
            {row.original.statut.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            {canEdit && row.original.equipement && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingEquipement(row.original.equipement!)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {canDelete && row.original.equipement && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingId(row.original.equipementId)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canEdit, canDelete],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleDeleteConfirm = () => {
    if (deletingId && onDelete) {
      onDelete(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher code, désignation, localisation…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Tous les statuts</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showAddButton && canCreate && (
          <Button onClick={() => (onAdd ? onAdd() : setIsAddingNew(true))} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="border-b border-border bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  Chargement...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Aucun équipement trouvé
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-border hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {filtered.length} équipement{filtered.length > 1 ? "s" : ""} trouvé
          {filtered.length > 1 ? "s" : ""}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="flex items-center gap-1 text-sm">
            Page {table.getState().pagination.pageIndex + 1} sur{" "}
            {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      {(isAddingNew || editingEquipement) && (
        <EquipementFormModal
          equipement={editingEquipement || undefined}
          isOpen={isAddingNew || !!editingEquipement}
          onClose={() => {
            setIsAddingNew(false);
            setEditingEquipement(null);
          }}
          onSuccess={() => {
            setIsAddingNew(false);
            setEditingEquipement(null);
            onRefresh?.();
          }}
        />
      )}

      {/* Delete confirmation is handled by parent component */}
      {deletingId && onDelete && (
        <div className="hidden" />
      )}
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
    <Button variant="ghost" size="sm" onClick={onClick} className="gap-1">
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </Button>
  );
}
