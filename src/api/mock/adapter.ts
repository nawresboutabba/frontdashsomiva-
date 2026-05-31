import type { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  auditEvents,
  categoriesList,
  computeKPIs,
  equipements,
  pieces,
  reperes,
  sousCategoriesList,
  taillesList,
  users,
} from "./seed";
import type { AuditEvent, Piece } from "../types";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

function ok<T>(data: T, config: AxiosRequestConfig): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: config as never,
  };
}

function okEnvelope<T>(
  data: T,
  config: AxiosRequestConfig,
  meta?: Record<string, unknown>,
): AxiosResponse {
  return ok(
    {
      success: true,
      message: "Mock response",
      data,
      meta,
      timestamp: new Date().toISOString(),
    },
    config,
  );
}

function fail(status: number, message: string, config: AxiosRequestConfig): never {
  const err = new Error(message) as Error & { response: AxiosResponse };
  err.response = {
    data: { message },
    status,
    statusText: message,
    headers: {},
    config: config as never,
  };
  throw err;
}

function getParam(
  config: AxiosRequestConfig,
  urlParams: URLSearchParams,
  key: string,
  fallback: string,
) {
  const params = config.params as Record<string, unknown> | undefined;
  const value = params?.[key] ?? urlParams.get(key);
  return value === undefined || value === null ? fallback : String(value);
}

function paginated<T>(
  items: T[],
  config: AxiosRequestConfig,
  urlParams: URLSearchParams,
  defaults = { page: 1, limit: 100 },
) {
  const page = Math.max(
    parseInt(getParam(config, urlParams, "page", String(defaults.page)), 10),
    1,
  );
  const limit = Math.max(
    parseInt(getParam(config, urlParams, "limit", String(defaults.limit)), 10),
    1,
  );
  const start = (page - 1) * limit;
  const totalPages = Math.ceil(items.length / limit) || 1;

  return okEnvelope(items.slice(start, start + limit), config, {
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
}

function definedPatch<T extends Record<string, unknown>>(patch: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export async function mockAdapter(config: AxiosRequestConfig): Promise<AxiosResponse> {
  await delay(200 + Math.random() * 250);

  const [path, query = ""] = (config.url || "").replace(/^\/api\/v1/, "").split("?");
  const url = path || "";
  const urlParams = new URLSearchParams(query);
  const method = (config.method || "get").toLowerCase();
  const body = config.data ? JSON.parse(config.data) : {};

  if (url === "/auth/login" && method === "post") {
    const identifier = body.email || body.username;
    const u = users.find(
      (x) => (x.email === identifier || x.username === identifier) && x.password === body.password,
    );

    if (!u) return fail(401, "Identifiants invalides", config);

    return okEnvelope(
      {
        accessToken: `mock.${btoa(JSON.stringify({ sub: u.id, role: u.role }))}.sig`,
        tokenType: "Bearer",
        expiresIn: "8h",
        utilisateur: {
          id: u.id,
          nom: u.fullName.split(" ").slice(1).join(" ") || u.fullName,
          prenom: u.fullName.split(" ")[0] || u.fullName,
          email: u.email,
          role: u.role,
        },
      },
      config,
    );
  }

  if (url === "/dashboard/kpis" && method === "get") {
    return okEnvelope(computeKPIs(), config);
  }

  if (url === "/equipements" && method === "get") {
    return paginated(equipements, config, urlParams);
  }

  if (url === "/categories" && method === "get") {
    return paginated(categoriesList, config, urlParams);
  }

  if (url === "/sous-categories" && method === "get") {
    return paginated(sousCategoriesList, config, urlParams);
  }

  if (url === "/tailles" && method === "get") {
    return paginated(taillesList, config, urlParams);
  }

  if (url === "/reperes" && method === "get") {
    return paginated(reperes, config, urlParams);
  }

  if ((url === "/pieces" || url === "/pieces-de-rechange") && method === "get") {
    return paginated(pieces, config, urlParams);
  }

  if (url.match(/^\/(pieces|pieces-de-rechange)\/[^/]+$/) && method === "patch") {
    const id = url.split("/")[2];
    const p = pieces.find((piece) => piece.id === id);
    if (!p) return fail(404, "Piece introuvable", config);

    Object.assign(
      p,
      definedPatch({
        code: body.reference,
        designation: body.designation,
        stock: body.stockActuel,
        stockMin: body.stockMinimum,
        prixUnitaire: body.prixUnitaire,
        unite: body.uniteMesure,
      }),
    );

    const ev: AuditEvent = {
      id: `ev-${Date.now()}`,
      user: body.__user || "Systeme",
      role: body.__role || "ADMIN",
      action: "stock.adjust",
      entity: "Piece",
      entityId: p.code,
      details: `Stock ajuste a ${p.stock}`,
      timestamp: new Date().toISOString(),
    };
    auditEvents.unshift(ev);

    return okEnvelope(p, config);
  }

  if ((url === "/audit" || url === "/audit-logs") && method === "get") {
    return paginated(auditEvents, config, urlParams, { page: 1, limit: 20 });
  }

  return fail(404, `Route mock introuvable: ${method.toUpperCase()} ${url}`, config);
}
