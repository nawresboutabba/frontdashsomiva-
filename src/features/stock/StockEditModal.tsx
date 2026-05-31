import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePiece } from "@/api/endpoints/pieces";
import type { Piece } from "@/api/types";

export function StockEditModal({
  piece,
  onClose,
}: {
  piece: Piece | null;
  onClose: () => void;
}) {
  const [stock, setStock] = useState(0);
  const [stockMin, setStockMin] = useState(0);
  const qc = useQueryClient();

  useEffect(() => {
    if (piece) {
      setStock(piece.stock);
      setStockMin(piece.stockMin);
    }
  }, [piece]);

  const m = useMutation({
    mutationFn: () =>
      updatePiece(piece!.id, {
        stock,
        stockMin,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pieces"] });
      qc.invalidateQueries({ queryKey: ["kpis"] });
      qc.invalidateQueries({ queryKey: ["audit"] });
      onClose();
    },
  });

  return (
    <Dialog open={!!piece} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">{piece?.code}</DialogTitle>
          <DialogDescription>{piece?.designation}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs uppercase tracking-wider">Stock actuel</Label>
            <Input
              type="number"
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value || "0", 10))}
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider">Stock minimum</Label>
            <Input
              type="number"
              value={stockMin}
              onChange={(e) => setStockMin(parseInt(e.target.value || "0", 10))}
              className="mt-1 font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
