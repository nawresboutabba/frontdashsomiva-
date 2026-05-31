import type {
  AuditEvent,
  Categorie,
  Equipement,
  EquipementStatus,
  KPIs,
  Piece,
  Repere,
  SousCategorie,
  Taille,
  User,
} from "../types";

const RNG = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
};
const rnd = RNG(424242);
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
const int = (min: number, max: number) =>
  Math.floor(rnd() * (max - min + 1)) + min;

export const users: (User & { password: string })[] = [
  {
    id: "u-1",
    username: "admin",
    password: "Admin@123456",
    fullName: "Karim El Idrissi",
    email: "admin@somiva.com",
    role: "ADMIN",
  },
  {
    id: "u-2",
    username: "magasinier",
    password: "Magasinier@123456",
    fullName: "Fatima Benali",
    email: "magasinier@somiva.com",
    role: "MAGASINIER",
  },
  {
    id: "u-3",
    username: "maintenance",
    password: "Maintenance@123456",
    fullName: "Youssef Ouazzani",
    email: "maintenance@somiva.com",
    role: "RESPONSABLE_MAINTENANCE",
  },
  {
    id: "u-4",
    username: "consultation",
    password: "Consultation@123456",
    fullName: "Salma Tazi",
    email: "consultation@somiva.com",
    role: "CONSULTATION",
  },
];

const STATUTS: EquipementStatus[] = ["EN_SERVICE", "EN_ARRET", "EN_MAINTENANCE"];

const equipementDefs = [
  { code: "BR-01", nom: "Broyeur Primaire #1", loc: "Atelier Concassage A" },
  { code: "BR-02", nom: "Broyeur Secondaire #2", loc: "Atelier Concassage B" },
  { code: "FL-01", nom: "Cellule de Flottation 1", loc: "Hall Flottation" },
  { code: "FL-02", nom: "Cellule de Flottation 2", loc: "Hall Flottation" },
  { code: "CV-12", nom: "Convoyeur CV-12", loc: "Liaison N°2" },
  { code: "CV-15", nom: "Convoyeur CV-15", loc: "Liaison N°3" },
  { code: "PM-04", nom: "Pompe de Pulpe 4\"", loc: "Station Pompage S2" },
  { code: "PM-07", nom: "Pompe Centrifuge 6\"", loc: "Station Pompage S1" },
  { code: "SE-01", nom: "Sécheur Rotatif", loc: "Unité Séchage" },
  { code: "CL-03", nom: "Classificateur Hydrocyclone", loc: "Atelier Lavage" },
  { code: "EL-22", nom: "Tableau Électrique HT-22", loc: "Salle HT" },
  { code: "CO-08", nom: "Compresseur Atlas 8B", loc: "Station Air Comprimé" },
];

const categories = ["Mécanique", "Électrique", "Hydraulique", "Pneumatique", "Structure"];
const sousCats: Record<string, string[]> = {
  Mécanique: ["Roulements", "Engrenages", "Courroies"],
  Électrique: ["Moteurs", "Capteurs", "Câblage"],
  Hydraulique: ["Vérins", "Distributeurs", "Joints"],
  Pneumatique: ["Vannes", "Filtres"],
  Structure: ["Châssis", "Visserie"],
};
const tailles = ["S", "M", "L", "XL", "DN50", "DN100", "DN150"];

export const equipements: Equipement[] = equipementDefs.map((d, i) => ({
  id: `eq-${i + 1}`,
  code: d.code,
  nom: d.nom,
  localisation: d.loc,
  statut: STATUTS[i % 3],
  miseEnService: `20${10 + (i % 12)}-0${(i % 9) + 1}-15`,
  description: `Équipement industriel ${d.nom} installé en ${d.loc}.`,
}));

export const categoriesList: Categorie[] = [];
export const sousCategoriesList: SousCategorie[] = [];
export const taillesList: Taille[] = [];
export const reperes: Repere[] = [];
export const pieces: Piece[] = [];

let cId = 0,
  scId = 0,
  tId = 0,
  rId = 0,
  pId = 0;

for (const eq of equipements) {
  const eqCats = categories.slice(0, int(2, 4));
  for (const catName of eqCats) {
    cId++;
    const cat: Categorie = { id: `cat-${cId}`, nom: catName, equipementId: eq.id };
    categoriesList.push(cat);
    for (const scName of sousCats[catName].slice(0, int(1, 3))) {
      scId++;
      const sc: SousCategorie = {
        id: `sc-${scId}`,
        nom: scName,
        categorieId: cat.id,
      };
      sousCategoriesList.push(sc);
      for (let t = 0; t < int(1, 2); t++) {
        tId++;
        const taille: Taille = {
          id: `t-${tId}`,
          label: pick(tailles),
          sousCategorieId: sc.id,
        };
        taillesList.push(taille);
        for (let r = 0; r < int(1, 2); r++) {
          rId++;
          const rep: Repere = {
            id: `r-${rId}`,
            code: `R${String(rId).padStart(4, "0")}`,
            designation: `${scName} ${taille.label} #${r + 1}`,
            tailleId: taille.id,
          };
          reperes.push(rep);
          for (let p = 0; p < int(1, 2); p++) {
            pId++;
            const stockMin = int(2, 10);
            const stock = rnd() < 0.18 ? int(0, stockMin - 1) : int(stockMin, stockMin * 6);
            pieces.push({
              id: `p-${pId}`,
              code: `PCE-${String(pId).padStart(5, "0")}`,
              designation: `${scName} ${taille.label}`,
              repereId: rep.id,
              categorie: catName,
              stock,
              stockMin,
              prixUnitaire: int(50, 8500),
              unite: pick(["pcs", "kg", "m", "L"]),
            });
          }
        }
      }
    }
  }
}

export function computeKPIs(): KPIs {
  const parStatut = STATUTS.reduce(
    (acc, s) => ({ ...acc, [s]: equipements.filter((e) => e.statut === s).length }),
    {} as Record<EquipementStatus, number>,
  );
  const sousStockMin = pieces.filter((p) => p.stock < p.stockMin).length;
  const valeurStock = pieces.reduce((s, p) => s + p.stock * p.prixUnitaire, 0);

  const byCatMap = new Map<string, { stock: number; valeur: number }>();
  for (const p of pieces) {
    const cur = byCatMap.get(p.categorie) ?? { stock: 0, valeur: 0 };
    cur.stock += p.stock;
    cur.valeur += p.stock * p.prixUnitaire;
    byCatMap.set(p.categorie, cur);
  }

  const today = new Date();
  const maintenance30j = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toISOString().slice(0, 10),
      interventions: int(0, 8),
    };
  });

  return {
    totalEquipements: equipements.length,
    totalCategories: categoriesList.length,
    totalReperes: reperes.length,
    totalPieces: pieces.length,
    piecesSousStockMin: sousStockMin,
    valeurStock,
    parStatut,
    trends: {
      equipements: 2.4,
      pieces: 5.1,
      stockValeur: -1.8,
      alertes: 12.3,
    },
    stockParCategorie: Array.from(byCatMap.entries()).map(([categorie, v]) => ({
      categorie,
      ...v,
    })),
    maintenance30j,
  };
}

const ACTIONS: { action: AuditEvent["action"]; entity: string; tpl: (id: string) => string }[] = [
  { action: "auth.login", entity: "Session", tpl: () => "Connexion réussie" },
  { action: "equipement.update", entity: "Équipement", tpl: (id) => `Mise à jour ${id}` },
  { action: "stock.adjust", entity: "Pièce", tpl: (id) => `Ajustement stock ${id}` },
  { action: "stock.alert", entity: "Pièce", tpl: (id) => `Stock minimum atteint sur ${id}` },
  { action: "piece.update", entity: "Pièce", tpl: (id) => `Pièce ${id} modifiée` },
  { action: "equipement.create", entity: "Équipement", tpl: (id) => `Création ${id}` },
];

export const auditEvents: AuditEvent[] = Array.from({ length: 60 }, (_, i) => {
  const u = pick(users);
  const a = pick(ACTIONS);
  const eqOrP = a.entity === "Équipement" ? pick(equipements).code : pick(pieces).code;
  const ts = new Date();
  ts.setMinutes(ts.getMinutes() - i * int(15, 240));
  return {
    id: `ev-${i + 1}`,
    user: u.fullName,
    role: u.role,
    action: a.action,
    entity: a.entity,
    entityId: eqOrP,
    details: a.tpl(eqOrP),
    timestamp: ts.toISOString(),
  };
});
