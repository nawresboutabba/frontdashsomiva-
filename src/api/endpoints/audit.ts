import { api } from "../client";
import {
  normalizeAuditEvent,
  unwrapWithMeta,
  type ApiEnvelope,
  type ApiListMeta,
  type BackendAuditLog,
} from "../backend";
import type { AuditEvent } from "../types";

export interface AuditPage {
  items: AuditEvent[];
  total: number;
  page: number;
  size: number;
}

export async function getAudit(page = 0, size = 20) {
  const { data } = await api.get<ApiEnvelope<BackendAuditLog[], ApiListMeta> | BackendAuditLog[]>(
    "/audit-logs",
    {
      params: {
        page: page + 1,
        limit: size,
        sortBy: "dateAction",
        sortOrder: "desc",
      },
    },
  );
  const { data: items, meta } = unwrapWithMeta<BackendAuditLog[], ApiListMeta>(data);
  const pagination = meta?.pagination;

  return {
    items: items.map(normalizeAuditEvent),
    total: pagination?.total ?? items.length,
    page: pagination ? pagination.page - 1 : page,
    size: pagination?.limit ?? size,
  };
}
