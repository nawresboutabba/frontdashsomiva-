import {
  AlertTriangle,
  Boxes,
  CircleDot,
  Coins,
  Layers,
  Tag,
  Wrench,
} from "lucide-react";
import { KpiCard } from "./KpiCard";
import { fmtMAD, fmtNum } from "@/utils/format";
import type { KPIs } from "@/api/types";

export function KpiGrid({ kpis }: { kpis: KPIs }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      <KpiCard
        index={0}
        label="Équipements"
        value={fmtNum(kpis.totalEquipements)}
        icon={Wrench}
        trend={kpis.trends.equipements}
        hint="Parc machine total"
      />
      <KpiCard
        index={1}
        label="Catégories"
        value={fmtNum(kpis.totalCategories)}
        icon={Tag}
        hint="Toutes machines confondues"
      />
      <KpiCard
        index={2}
        label="Repères"
        value={fmtNum(kpis.totalReperes)}
        icon={Layers}
        hint="Références identifiées"
      />
      <KpiCard
        index={3}
        label="Pièces de rechange"
        value={fmtNum(kpis.totalPieces)}
        icon={Boxes}
        trend={kpis.trends.pieces}
      />
      <KpiCard
        index={4}
        label="Sous stock minimum"
        value={fmtNum(kpis.piecesSousStockMin)}
        icon={AlertTriangle}
        variant="danger"
        trend={kpis.trends.alertes}
        hint="Réapprovisionnement requis"
      />
      <KpiCard
        index={5}
        label="Valeur totale stock"
        value={fmtMAD(kpis.valeurStock)}
        icon={Coins}
        trend={kpis.trends.stockValeur}
        hint="Au prix unitaire"
      />
      <KpiCard
        index={6}
        label="En service"
        value={fmtNum(kpis.parStatut.EN_SERVICE)}
        icon={CircleDot}
        variant="success"
        hint="Équipements opérationnels"
      />
      <KpiCard
        index={7}
        label="En maintenance / arrêt"
        value={fmtNum(kpis.parStatut.EN_MAINTENANCE + kpis.parStatut.EN_ARRET)}
        icon={CircleDot}
        variant="warning"
        hint={`Maint. ${kpis.parStatut.EN_MAINTENANCE} · Arrêt ${kpis.parStatut.EN_ARRET}`}
      />
    </div>
  );
}
