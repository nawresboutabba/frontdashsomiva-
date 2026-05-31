import type { Role } from "@/api/types";

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrateur",
  MAGASINIER: "Magasinier",
  RESPONSABLE_MAINTENANCE: "Resp. Maintenance",
  CONSULTATION: "Consultation",
};

export const can = {
  editStock: (r?: Role) =>
    r === "ADMIN" || r === "MAGASINIER" || r === "RESPONSABLE_MAINTENANCE",
  editEquipment: (r?: Role) => r === "ADMIN" || r === "RESPONSABLE_MAINTENANCE",
  createEquipement: (r?: Role) => r === "ADMIN" || r === "RESPONSABLE_MAINTENANCE",
  editEquipement: (r?: Role) => r === "ADMIN" || r === "RESPONSABLE_MAINTENANCE",
  deleteEquipement: (r?: Role) => r === "ADMIN",
  viewAudit: (r?: Role) => r === "ADMIN",
};

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/",
  MAGASINIER: "/stock",
  RESPONSABLE_MAINTENANCE: "/equipements",
  CONSULTATION: "/",
};
