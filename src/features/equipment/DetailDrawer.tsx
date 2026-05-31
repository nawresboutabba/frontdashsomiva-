import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { fmtMAD, fmtNum } from "@/utils/format";
import type { TreeSelection } from "./EquipmentTree";

export function DetailDrawer({
  selection,
  onClose,
}: {
  selection: TreeSelection | null;
  onClose: () => void;
}) {
  const open = !!selection;
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-base">
            {selection?.type === "equipement" && selection.data.code}
            {selection?.type === "piece" && selection.data.code}
            {selection?.type === "generic" && selection.label}
          </SheetTitle>
        </SheetHeader>

        {selection?.type === "equipement" && (
          <div className="mt-4 space-y-4 text-sm">
            <div className="rounded-md border border-border bg-muted/40 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Désignation
              </div>
              <div className="mt-1 font-semibold">{selection.data.nom}</div>
            </div>
            <Field label="Statut">
              <Badge variant="outline" className="font-mono text-[10px]">
                {selection.data.statut.replace("_", " ")}
              </Badge>
            </Field>
            <Field label="Localisation">{selection.data.localisation}</Field>
            <Field label="Mise en service" mono>
              {selection.data.miseEnService}
            </Field>
            {selection.data.description && (
              <Field label="Description">{selection.data.description}</Field>
            )}
          </div>
        )}

        {selection?.type === "piece" && (
          <div className="mt-4 space-y-4 text-sm">
            <Field label="Désignation">{selection.data.designation}</Field>
            <Field label="Catégorie">{selection.data.categorie}</Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stock actuel" mono>
                <span
                  className={
                    selection.data.stock < selection.data.stockMin
                      ? "text-destructive"
                      : "text-success"
                  }
                >
                  {fmtNum(selection.data.stock)} {selection.data.unite}
                </span>
              </Field>
              <Field label="Stock minimum" mono>
                {fmtNum(selection.data.stockMin)} {selection.data.unite}
              </Field>
              <Field label="Prix unitaire" mono>
                {fmtMAD(selection.data.prixUnitaire)}
              </Field>
              <Field label="Valeur stock" mono>
                {fmtMAD(selection.data.stock * selection.data.prixUnitaire)}
              </Field>
            </div>
          </div>
        )}

        {selection?.type === "generic" && (
          <div className="mt-4 text-sm">
            <div className="rounded-md border border-border bg-muted/40 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {selection.sub}
              </div>
              <div className="mt-1 font-semibold">{selection.label}</div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={mono ? "mt-0.5 font-mono" : "mt-0.5"}>{children}</div>
    </div>
  );
}
