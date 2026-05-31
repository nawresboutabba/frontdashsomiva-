export type Role = "ADMIN" | "MAGASINIER" | "RESPONSABLE_MAINTENANCE" | "CONSULTATION";

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type EquipementStatus = "EN_SERVICE" | "EN_ARRET" | "EN_MAINTENANCE";

export interface Piece {
  id: string;
  code: string;
  designation: string;
  repereId: string;
  categorie: string;
  stock: number;
  stockMin: number;
  prixUnitaire: number;
  unite: string;
}

export interface Repere {
  id: string;
  code: string;
  designation: string;
  tailleId: string;
}

export interface Taille {
  id: string;
  label: string;
  sousCategorieId: string;
}

export interface SousCategorie {
  id: string;
  nom: string;
  categorieId: string;
}

export interface Categorie {
  id: string;
  nom: string;
  equipementId: string;
}

export interface Equipement {
  id: string;
  code: string;
  nom: string;
  localisation: string;
  statut: EquipementStatus;
  miseEnService: string;
  description?: string;
}

export interface KPIs {
  totalEquipements: number;
  totalCategories: number;
  totalReperes: number;
  totalPieces: number;
  piecesSousStockMin: number;
  valeurStock: number;
  parStatut: Record<EquipementStatus, number>;
  trends: {
    equipements: number;
    pieces: number;
    stockValeur: number;
    alertes: number;
  };
  stockParCategorie: { categorie: string; stock: number; valeur: number }[];
  maintenance30j: { date: string; interventions: number }[];
}

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "equipement.update"
  | "equipement.create"
  | "stock.adjust"
  | "stock.alert"
  | "piece.update";

export interface AuditEvent {
  id: string;
  user: string;
  role: Role;
  action: AuditAction;
  entity: string;
  entityId?: string;
  details?: string;
  timestamp: string;
}
