import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getEquipementTree, getEquipements, deleteEquipement, type EquipementResponse } from "@/api/endpoints/equipements";
import { EquipmentTree, type TreeSelection } from "@/features/equipment/EquipmentTree";
import { EquipementTable } from "@/features/equipment/EquipementTable";
import { DetailDrawer } from "@/features/equipment/DetailDrawer";
import { EquipementFormModal } from "@/features/equipment/EquipementFormModal";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/store/authStore";
import { can } from "@/utils/rbac";

export const Route = createFileRoute("/_authenticated/equipements")({
  head: () => ({
    meta: [
      { title: "Équipements · SOMIVA EAM" },
      { name: "description", content: "Arborescence complète des équipements, catégories, repères et pièces." },
    ],
  }),
  component: EquipementsPage,
});

function EquipementsPage() {
  const [view, setView] = useState<"tree" | "table">("tree");
  const [sel, setSel] = useState<TreeSelection | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const canCreate = can.createEquipement(role);

  const { data: treeData, isLoading: isTreeLoading } = useQuery({
    queryKey: ["equipements-tree"],
    queryFn: getEquipementTree,
  });

  const { data: equipements = [], isLoading: isTableLoading, refetch: refetchEquipements } = useQuery({
    queryKey: ["equipements"],
    queryFn: getEquipements,
    enabled: view === "table",
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEquipement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipements"] });
      queryClient.invalidateQueries({ queryKey: ["equipements-tree"] });
      setDeletingId(null);
    },
  });

  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            Gestion technique
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Équipements</h1>
          <p className="text-sm text-muted-foreground">
            Équipement → Catégorie → Sous-catégorie → Taille → Repère → Pièce
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsAddingNew(true)}>
            Ajouter équipement
          </Button>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={view === "tree" ? "default" : "outline"}
          onClick={() => setView("tree")}
        >
          Vue arborescente
        </Button>
        <Button
          variant={view === "table" ? "default" : "outline"}
          onClick={() => setView("table")}
        >
          Vue tableau
        </Button>
      </div>

      {/* Tree View */}
      {view === "tree" && (
        <>
          {isTreeLoading || !treeData ? (
            <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Chargement de l'arborescence…
            </div>
          ) : (
            <div className="h-[calc(100vh-220px)] min-h-[500px]">
              <EquipmentTree data={treeData} onSelect={setSel} />
            </div>
          )}

          <DetailDrawer selection={sel} onClose={() => setSel(null)} />
        </>
      )}

      {/* Table View */}
      {view === "table" && (
        <EquipementTable
          equipements={equipements}
          treeData={treeData}
          isLoading={isTableLoading || isTreeLoading}
          onRefresh={refetchEquipements}
          showAddButton={false}
        />
      )}

      <EquipementFormModal
        isOpen={isAddingNew}
        onClose={() => setIsAddingNew(false)}
        onSuccess={() => {
          setIsAddingNew(false);
          queryClient.invalidateQueries({ queryKey: ["equipements"] });
          queryClient.invalidateQueries({ queryKey: ["equipements-tree"] });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'équipement</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
