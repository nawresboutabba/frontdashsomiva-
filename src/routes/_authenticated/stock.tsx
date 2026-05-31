import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getPieces } from "@/api/endpoints/pieces";
import { StockTable } from "@/features/stock/StockTable";

export const Route = createFileRoute("/_authenticated/stock")({
  head: () => ({
    meta: [
      { title: "Stock · SOMIVA EAM" },
      { name: "description", content: "Gestion du stock de pièces de rechange avec alertes seuil minimum." },
    ],
  }),
  component: StockPage,
});

function StockPage() {
  const { data, isLoading } = useQuery({ queryKey: ["pieces"], queryFn: getPieces });

  return (
    <div className="space-y-4">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Magasin
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Pièces de rechange</h1>
        <p className="text-sm text-muted-foreground">
          Suivi des stocks, alertes minimum et ajustements rapides.
        </p>
      </div>

      {isLoading || !data ? (
        <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Chargement du stock…
        </div>
      ) : (
        <StockTable pieces={data} />
      )}
    </div>
  );
}
