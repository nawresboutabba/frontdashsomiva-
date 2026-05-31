import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getKPIs } from "@/api/endpoints/dashboard";
import { KpiGrid } from "@/features/dashboard/KpiGrid";
import { MaintenanceLine, StatusPie, StockBar } from "@/features/dashboard/Charts";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord · SOMIVA EAM" },
      { name: "description", content: "KPIs industriels, statut équipements et alertes stock en temps réel." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({ queryKey: ["kpis"], queryFn: getKPIs });

  if (isLoading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Chargement des indicateurs…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            Vue d'ensemble
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Bonjour, {user?.fullName.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Indicateurs clés de performance du parc industriel SOMIVA.
          </p>
        </div>
        <div className="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="text-primary">●</span> Données live ·{" "}
          {new Date().toLocaleString("fr-FR")}
        </div>
      </div>

      <KpiGrid kpis={data} />

      <div className="grid gap-3 lg:grid-cols-3">
        <StatusPie kpis={data} />
        <StockBar kpis={data} />
        <MaintenanceLine kpis={data} />
      </div>
    </div>
  );
}
