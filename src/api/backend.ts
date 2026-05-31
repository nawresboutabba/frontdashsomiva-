import { api } from "./client";
import type {
  AuditAction,
  AuditEvent,
  Categorie,
  Equipement,
  EquipementStatus,
  KPIs,
  LoginResponse,
  Piece,
  Repere,
  Role,
  SousCategorie,
  Taille,
  User,
} from "./types";

export interface ApiEnvelope<T, M = Record<string, unknown>> {
  success: boolean;
  message?: string;
  data: T;
  meta?: M;
  timestamp?: string;
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type ApiListMeta = {
  pagination?: ApiPagination;
};

export interface BackendUser {
  id: string;
  nom?: string;
  prenom?: string;
  username?: string;
  fullName?: string;
  email: string;
  role: Role;
}

export interface BackendAuthToken {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  utilisateur: BackendUser;
}

export interface BackendEquipement {
  id: string;
  code: string;
  designation?: string;
  nom?: string;
  localisation?: string;
  fabricant?: string;
  dateInstallation?: string;
  miseEnService?: string;
  description?: string;
  statut?: string;
}

export interface BackendCategorie {
  id: string;
  equipementId: string;
  code?: string;
  libelle?: string;
  nom?: string;
  description?: string;
}

export interface BackendSousCategorie {
  id: string;
  categorieId: string;
  code?: string;
  libelle?: string;
  nom?: string;
  description?: string;
}

export interface BackendTaille {
  id: string;
  sousCategorieId: string;
  code?: string;
  valeur?: string;
  unite?: string;
  label?: string;
}

export interface BackendRepere {
  id: string;
  tailleId: string;
  pieceDeRechangeId?: string;
  numeroRepere?: string;
  code?: string;
  designation?: string;
  quantite?: number;
  position?: string;
}

export interface BackendPiece {
  id: string;
  reference?: string;
  code?: string;
  designation: string;
  marque?: string;
  uniteMesure?: string;
  unite?: string;
  stockActuel?: number;
  stock?: number;
  stockMinimum?: number;
  stockMin?: number;
  prixUnitaire?: number;
  repereId?: string;
  categorie?: string;
}

export interface BackendDashboardKpi {
  nombreEquipements?: number;
  nombreCategories?: number;
  nombreReperes?: number;
  nombrePiecesDeRechange?: number;
  piecesSousStockMinimum?: number;
  valeurTotaleStock?: number;
  repartitionEquipementsParStatut?: Array<{
    statut: string;
    total: number;
  }>;
}

export interface BackendAuditLog {
  id: string;
  utilisateurId?: string;
  user?: string;
  role?: Role;
  action: string;
  entite?: string;
  entity?: string;
  entiteId?: string;
  entityId?: string;
  details?: string;
  dateAction?: string;
  timestamp?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface BackendHierarchy {
  equipements: BackendEquipement[];
  categories: BackendCategorie[];
  sousCategories: BackendSousCategorie[];
  tailles: BackendTaille[];
  reperes: BackendRepere[];
  pieces: BackendPiece[];
}

const FRONT_AUDIT_ACTIONS = new Set<AuditAction>([
  "auth.login",
  "auth.logout",
  "equipement.update",
  "equipement.create",
  "stock.adjust",
  "stock.alert",
  "piece.update",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function isApiEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  return isRecord(payload) && "success" in payload && "data" in payload;
}

export function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  return isApiEnvelope<T>(payload) ? payload.data : payload;
}

export function unwrapWithMeta<T, M = Record<string, unknown>>(
  payload: ApiEnvelope<T, M> | T,
): { data: T; meta?: M } {
  if (isApiEnvelope<T>(payload)) {
    return { data: payload.data, meta: payload.meta as M | undefined };
  }
  return { data: payload };
}

export async function fetchAllPages<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<T[]> {
  const items: T[] = [];
  let page = Number(params.page ?? 1);

  while (true) {
    const response = await api.get<ApiEnvelope<T[], ApiListMeta> | T[]>(path, {
      params: {
        limit: 100,
        ...params,
        page,
      },
    });
    const { data, meta } = unwrapWithMeta<T[], ApiListMeta>(response.data);
    items.push(...data);

    const pagination = meta?.pagination;
    if (!pagination?.hasNextPage) break;
    page = pagination.page + 1;
  }

  return items;
}

export async function fetchBackendHierarchy(): Promise<BackendHierarchy> {
  const [equipements, categories, sousCategories, tailles, reperes, pieces] =
    await Promise.all([
      fetchAllPages<BackendEquipement>("/equipements", { sortBy: "code", sortOrder: "asc" }),
      fetchAllPages<BackendCategorie>("/categories", { sortBy: "code", sortOrder: "asc" }),
      fetchAllPages<BackendSousCategorie>("/sous-categories", {
        sortBy: "code",
        sortOrder: "asc",
      }),
      fetchAllPages<BackendTaille>("/tailles", { sortBy: "code", sortOrder: "asc" }),
      fetchAllPages<BackendRepere>("/reperes", { sortBy: "numeroRepere", sortOrder: "asc" }),
      fetchAllPages<BackendPiece>("/pieces-de-rechange", {
        sortBy: "reference",
        sortOrder: "asc",
      }),
    ]);

  return {
    equipements,
    categories,
    sousCategories,
    tailles,
    reperes,
    pieces,
  };
}

export function normalizeUser(user: BackendUser | User): User {
  if ("fullName" in user && user.fullName) {
    return {
      id: user.id,
      username: user.username || user.email,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }

  const backendUser = user as BackendUser;
  const fullName = [backendUser.prenom, backendUser.nom].filter(Boolean).join(" ").trim();

  return {
    id: backendUser.id,
    username: backendUser.username || backendUser.email,
    fullName: fullName || backendUser.email,
    email: backendUser.email,
    role: backendUser.role,
  };
}

export function normalizeLoginResponse(payload: BackendAuthToken | LoginResponse): LoginResponse {
  if ("accessToken" in payload) {
    return {
      token: payload.accessToken,
      user: normalizeUser(payload.utilisateur),
    };
  }
  return {
    token: payload.token,
    user: normalizeUser(payload.user),
  };
}

export function normalizeStatus(statut?: string): EquipementStatus {
  if (statut === "EN_SERVICE") return "EN_SERVICE";
  if (statut === "EN_MAINTENANCE") return "EN_MAINTENANCE";
  return "EN_ARRET";
}

export function normalizeEquipement(equipement: BackendEquipement): Equipement {
  return {
    id: equipement.id,
    code: equipement.code,
    nom: equipement.designation || equipement.nom || equipement.code,
    localisation: equipement.localisation || "",
    statut: normalizeStatus(equipement.statut),
    miseEnService:
      equipement.dateInstallation?.slice(0, 10) || equipement.miseEnService || "",
    description: equipement.description || equipement.fabricant,
  };
}

export function normalizeCategorie(categorie: BackendCategorie): Categorie {
  return {
    id: categorie.id,
    nom: categorie.libelle || categorie.nom || categorie.code || "Categorie",
    equipementId: categorie.equipementId,
  };
}

export function normalizeSousCategorie(sousCategorie: BackendSousCategorie): SousCategorie {
  return {
    id: sousCategorie.id,
    nom:
      sousCategorie.libelle ||
      sousCategorie.nom ||
      sousCategorie.code ||
      "Sous-categorie",
    categorieId: sousCategorie.categorieId,
  };
}

export function normalizeTaille(taille: BackendTaille): Taille {
  const label = taille.label || [taille.valeur, taille.unite].filter(Boolean).join(" ");

  return {
    id: taille.id,
    label: label || taille.code || "N/A",
    sousCategorieId: taille.sousCategorieId,
  };
}

export function normalizeRepere(repere: BackendRepere): Repere {
  return {
    id: repere.id,
    code: repere.numeroRepere || repere.code || repere.id,
    designation: repere.designation || repere.position || "",
    tailleId: repere.tailleId,
  };
}

export function normalizePiece(
  piece: BackendPiece,
  context: { repereId?: string; categorie?: string } = {},
): Piece {
  return {
    id: piece.id,
    code: piece.reference || piece.code || piece.id,
    designation: piece.designation,
    repereId: context.repereId || piece.repereId || "",
    categorie: context.categorie || piece.categorie || piece.marque || "Non classee",
    stock: Number(piece.stockActuel ?? piece.stock ?? 0),
    stockMin: Number(piece.stockMinimum ?? piece.stockMin ?? 0),
    prixUnitaire: Number(piece.prixUnitaire ?? 0),
    unite: piece.uniteMesure || piece.unite || "pcs",
  };
}

export function normalizeHierarchy(hierarchy: BackendHierarchy) {
  const categories = hierarchy.categories.map(normalizeCategorie);
  const sousCategories = hierarchy.sousCategories.map(normalizeSousCategorie);
  const tailles = hierarchy.tailles.map(normalizeTaille);
  const reperes = hierarchy.reperes.map(normalizeRepere);

  const categorieById = new Map(categories.map((categorie) => [categorie.id, categorie]));
  const sousCategorieById = new Map(
    sousCategories.map((sousCategorie) => [sousCategorie.id, sousCategorie]),
  );
  const tailleById = new Map(tailles.map((taille) => [taille.id, taille]));
  const repereByPieceId = new Map<string, BackendRepere>();
  const repereById = new Map(hierarchy.reperes.map((repere) => [repere.id, repere]));

  for (const repere of hierarchy.reperes) {
    if (repere.pieceDeRechangeId && !repereByPieceId.has(repere.pieceDeRechangeId)) {
      repereByPieceId.set(repere.pieceDeRechangeId, repere);
    }
  }

  const categoryNameForRepere = (repere?: BackendRepere) => {
    if (!repere) return undefined;
    const taille = tailleById.get(repere.tailleId);
    const sousCategorie = taille ? sousCategorieById.get(taille.sousCategorieId) : undefined;
    const categorie = sousCategorie ? categorieById.get(sousCategorie.categorieId) : undefined;
    return categorie?.nom;
  };

  const pieces = hierarchy.pieces.map((piece) => {
    const repere = piece.repereId
      ? repereById.get(piece.repereId)
      : repereByPieceId.get(piece.id);

    return normalizePiece(piece, {
      repereId: repere?.id || piece.repereId,
      categorie: categoryNameForRepere(repere),
    });
  });

  return {
    equipements: hierarchy.equipements.map(normalizeEquipement),
    categories,
    sousCategories,
    tailles,
    reperes,
    pieces,
  };
}

export function toBackendPiecePatch(patch: Partial<Piece>): Partial<BackendPiece> {
  const payload: Partial<BackendPiece> = {};

  if (patch.code !== undefined) payload.reference = patch.code;
  if (patch.designation !== undefined) payload.designation = patch.designation;
  if (patch.unite !== undefined) payload.uniteMesure = patch.unite;
  if (patch.stock !== undefined) payload.stockActuel = patch.stock;
  if (patch.stockMin !== undefined) payload.stockMinimum = patch.stockMin;
  if (patch.prixUnitaire !== undefined) payload.prixUnitaire = patch.prixUnitaire;

  return payload;
}

export function buildStockSummary(pieces: Piece[]): KPIs["stockParCategorie"] {
  const byCategorie = new Map<string, { stock: number; valeur: number }>();

  for (const piece of pieces) {
    const current = byCategorie.get(piece.categorie) || { stock: 0, valeur: 0 };
    current.stock += piece.stock;
    current.valeur += piece.stock * piece.prixUnitaire;
    byCategorie.set(piece.categorie, current);
  }

  return Array.from(byCategorie.entries()).map(([categorie, values]) => ({
    categorie,
    ...values,
  }));
}

export function emptyMaintenanceSeries(): KPIs["maintenance30j"] {
  const today = new Date();

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - index));
    return {
      date: date.toISOString().slice(0, 10),
      interventions: 0,
    };
  });
}

export function normalizeKPIs(raw: BackendDashboardKpi | KPIs, pieces: Piece[] = []): KPIs {
  const existing = raw as Partial<KPIs> & BackendDashboardKpi;
  const parStatut: Record<EquipementStatus, number> = {
    EN_SERVICE: 0,
    EN_MAINTENANCE: 0,
    EN_ARRET: 0,
  };

  if (existing.parStatut) {
    for (const [status, total] of Object.entries(existing.parStatut)) {
      parStatut[normalizeStatus(status)] += Number(total || 0);
    }
  }

  for (const item of existing.repartitionEquipementsParStatut || []) {
    parStatut[normalizeStatus(item.statut)] += Number(item.total || 0);
  }

  return {
    totalEquipements: Number(existing.totalEquipements ?? existing.nombreEquipements ?? 0),
    totalCategories: Number(existing.totalCategories ?? existing.nombreCategories ?? 0),
    totalReperes: Number(existing.totalReperes ?? existing.nombreReperes ?? 0),
    totalPieces: Number(existing.totalPieces ?? existing.nombrePiecesDeRechange ?? 0),
    piecesSousStockMin: Number(
      existing.piecesSousStockMin ?? existing.piecesSousStockMinimum ?? 0,
    ),
    valeurStock: Number(existing.valeurStock ?? existing.valeurTotaleStock ?? 0),
    parStatut,
    trends: existing.trends || {
      equipements: 0,
      pieces: 0,
      stockValeur: 0,
      alertes: 0,
    },
    stockParCategorie: existing.stockParCategorie || buildStockSummary(pieces),
    maintenance30j: existing.maintenance30j || emptyMaintenanceSeries(),
  };
}

function normalizeAuditAction(action: string, entity: string): AuditAction {
  if (FRONT_AUDIT_ACTIONS.has(action as AuditAction)) {
    return action as AuditAction;
  }

  if (action === "LOGIN") return "auth.login";
  if (action === "LOGOUT") return "auth.logout";
  if (action === "CREATE" && entity.toLowerCase().includes("equip")) {
    return "equipement.create";
  }
  if (action === "UPDATE" && entity.toLowerCase().includes("piece")) {
    return "stock.adjust";
  }
  if (action === "UPDATE" && entity.toLowerCase().includes("equip")) {
    return "equipement.update";
  }

  return "piece.update";
}

function auditDetails(log: BackendAuditLog, action: AuditAction, entity: string) {
  if (log.details) return log.details;
  if (action === "auth.login") return "Connexion reussie";
  if (action === "auth.logout") return "Deconnexion";
  if (action === "stock.adjust") return `Ajustement stock ${log.entiteId || ""}`.trim();
  if (action === "equipement.create") return `Creation ${entity}`.trim();
  if (action === "equipement.update") return `Mise a jour ${entity}`.trim();
  return `Mise a jour ${entity}`.trim();
}

export function normalizeAuditEvent(log: BackendAuditLog): AuditEvent {
  const entity = log.entite || log.entity || "Systeme";
  const action = normalizeAuditAction(log.action, entity);
  const metadataUser = log.metadata?.user;

  return {
    id: log.id,
    user:
      log.user ||
      (typeof metadataUser === "string" ? metadataUser : undefined) ||
      log.utilisateurId ||
      "Systeme",
    role: log.role || "ADMIN",
    action,
    entity,
    entityId: log.entiteId || log.entityId,
    details: auditDetails(log, action, entity),
    timestamp: log.dateAction || log.timestamp || log.createdAt || new Date().toISOString(),
  };
}
