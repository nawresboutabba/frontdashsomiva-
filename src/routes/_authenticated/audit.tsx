import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getAudit } from "@/api/endpoints/audit";
import { AuditTimeline } from "@/features/audit/AuditTimeline";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [
      { title: "Audit · SOMIVA EAM" },
      { name: "description", content: "Journal d'audit complet — connexions, modifications, alertes stock." },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: () => getAudit(0, 60),
  });

  return (
    <div className="space-y-4">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Traçabilité
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Audit & activité</h1>
        <p className="text-sm text-muted-foreground">
          Historique chronologique de toutes les actions utilisateurs sur le système.
        </p>
      </div>

      {isLoading || !data ? (
        <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Chargement…
        </div>
      ) : (
        <AuditTimeline events={data.items} />
      )}
    </div>
  );
}
