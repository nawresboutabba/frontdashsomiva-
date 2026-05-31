import type {
  Categorie,
  Equipement,
  Piece,
  Repere,
  SousCategorie,
  Taille,
  EquipementStatus,
} from "../types";
import { fetchBackendHierarchy, normalizeHierarchy, type ApiEnvelope, unwrap } from "../backend";
import { api } from "../client";

export interface EquipementTreeData {
  equipements: Equipement[];
  categories: Categorie[];
  sousCategories: SousCategorie[];
  tailles: Taille[];
  reperes: Repere[];
  pieces: Piece[];
}

export interface CreateEquipementRequest {
  code: string;
  designation: string;
  localisation: string;
  fabricant?: string;
  dateInstallation?: string;
  statut: EquipementStatus;
  categorieId?: string;
  sousCategorieId?: string;
  tailleId?: string;
  repereId?: string;
  pieceIds?: string[];
}

export interface UpdateEquipementRequest extends Partial<CreateEquipementRequest> {}

export interface EquipementResponse {
  id: string;
  code: string;
  designation: string;
  localisation: string;
  fabricant?: string;
  dateInstallation?: string;
  statut: EquipementStatus;
  categorie?: Categorie;
  sousCategorie?: SousCategorie;
  taille?: Taille;
  repere?: Repere;
  pieces?: Piece[];
  createdAt: string;
  updatedAt: string;
}

export async function getEquipementTree() {
  return normalizeHierarchy(await fetchBackendHierarchy());
}

export async function getEquipements() {
  const response = await api.get<ApiEnvelope<EquipementResponse[]> | EquipementResponse[]>(
    "/equipements",
  );
  return unwrap(response.data);
}

export async function createEquipement(data: CreateEquipementRequest) {
  const response = await api.post<ApiEnvelope<EquipementResponse> | EquipementResponse>(
    "/equipements",
    data,
  );
  return unwrap(response.data);
}

export async function updateEquipement(id: string, data: UpdateEquipementRequest) {
  const response = await api.patch<ApiEnvelope<EquipementResponse> | EquipementResponse>(
    `/equipements/${id}`,
    data,
  );
  return unwrap(response.data);
}

export async function deleteEquipement(id: string) {
  await api.delete(`/equipements/${id}`);
}

export async function getCategories() {
  const response = await api.get<ApiEnvelope<Categorie[]> | Categorie[]>("/categories");
  return unwrap(response.data);
}

export async function getSousCategories() {
  const response = await api.get<ApiEnvelope<SousCategorie[]> | SousCategorie[]>(
    "/sous-categories",
  );
  return unwrap(response.data);
}

export async function getTailles() {
  const response = await api.get<ApiEnvelope<Taille[]> | Taille[]>("/tailles");
  return unwrap(response.data);
}

export async function getReperes() {
  const response = await api.get<ApiEnvelope<Repere[]> | Repere[]>("/reperes");
  return unwrap(response.data);
}

export async function getPieces() {
  const response = await api.get<ApiEnvelope<Piece[]> | Piece[]>("/pieces-de-rechange");
  return unwrap(response.data);
}
