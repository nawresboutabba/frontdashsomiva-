import { api } from "../client";
import {
  normalizeKPIs,
  unwrap,
  type ApiEnvelope,
  type BackendDashboardKpi,
} from "../backend";
import type { KPIs } from "../types";
import { getPieces } from "./pieces";

export async function getKPIs() {
  const [response, pieces] = await Promise.all([
    api.get<ApiEnvelope<BackendDashboardKpi> | KPIs>("/dashboard/kpis"),
    getPieces().catch(() => []),
  ]);

  return normalizeKPIs(unwrap(response.data), pieces);
}
