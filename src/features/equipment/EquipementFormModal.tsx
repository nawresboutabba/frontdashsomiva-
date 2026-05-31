import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEquipement,
  getEquipementTree,
  updateEquipement,
  type CreateEquipementRequest,
  type EquipementResponse,
} from "@/api/endpoints/equipements";

interface EquipementFormModalProps {
  equipement?: EquipementResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EquipementFormModal({
  equipement,
  isOpen,
  onClose,
  onSuccess,
}: EquipementFormModalProps) {
  const [formData, setFormData] = useState<CreateEquipementRequest>({
    code: "",
    designation: "",
    localisation: "",
    fabricant: "",
    dateInstallation: "",
    statut: "EN_SERVICE",
    categorieId: undefined,
    sousCategorieId: undefined,
    tailleId: undefined,
    repereId: undefined,
    pieceIds: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: hierarchy } = useQuery({
    queryKey: ["equipements-tree"],
    queryFn: getEquipementTree,
  });

  const categories = hierarchy?.categories ?? [];
  const sousCategories = hierarchy?.sousCategories ?? [];
  const tailles = hierarchy?.tailles ?? [];
  const reperes = hierarchy?.reperes ?? [];
  const pieces = hierarchy?.pieces ?? [];
  const filteredSousCategories = useMemo(
    () => sousCategories.filter((sc) => sc.categorieId === formData.categorieId),
    [sousCategories, formData.categorieId],
  );
  const filteredTailles = useMemo(
    () => tailles.filter((t) => t.sousCategorieId === formData.sousCategorieId),
    [tailles, formData.sousCategorieId],
  );
  const filteredReperes = useMemo(
    () => reperes.filter((r) => r.tailleId === formData.tailleId),
    [reperes, formData.tailleId],
  );
  const filteredPieces = useMemo(
    () => pieces.filter((p) => p.repereId === formData.repereId),
    [pieces, formData.repereId],
  );

  // Reset form when modal opens/closes or equipement changes
  useEffect(() => {
    if (isOpen) {
      if (equipement) {
        setFormData({
          code: equipement.code,
          designation: equipement.designation,
          localisation: equipement.localisation,
          fabricant: equipement.fabricant || "",
          dateInstallation: equipement.dateInstallation || "",
          statut: equipement.statut,
          categorieId: equipement.categorie?.id,
          sousCategorieId: equipement.sousCategorie?.id,
          tailleId: equipement.taille?.id,
          repereId: equipement.repere?.id,
          pieceIds: equipement.pieces?.map((p) => p.id) || [],
        });
      } else {
        setFormData({
          code: "",
          designation: "",
          localisation: "",
          fabricant: "",
          dateInstallation: "",
          statut: "EN_SERVICE",
          categorieId: undefined,
          sousCategorieId: undefined,
          tailleId: undefined,
          repereId: undefined,
          pieceIds: [],
        });
      }
      setErrors({});
    }
  }, [isOpen, equipement]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Le code est obligatoire";
    }
    if (!formData.designation.trim()) {
      newErrors.designation = "La désignation est obligatoire";
    }
    if (!formData.localisation.trim()) {
      newErrors.localisation = "La localisation est obligatoire";
    }
    if (!formData.categorieId) {
      newErrors.categorieId = "La catégorie est obligatoire";
    }
    if (!formData.sousCategorieId) {
      newErrors.sousCategorieId = "La sous-catégorie est obligatoire";
    }
    if (!formData.tailleId) {
      newErrors.tailleId = "La taille est obligatoire";
    }
    if (!formData.repereId) {
      newErrors.repereId = "Le repère est obligatoire";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (): CreateEquipementRequest => ({
    code: formData.code,
    designation: formData.designation,
    localisation: formData.localisation,
    fabricant: formData.fabricant || undefined,
    dateInstallation: formData.dateInstallation || undefined,
    statut: formData.statut,
    categorieId: formData.categorieId,
    sousCategorieId: formData.sousCategorieId,
    tailleId: formData.tailleId,
    repereId: formData.repereId,
    pieceIds: formData.pieceIds?.length ? formData.pieceIds : undefined,
  });

  const getSubmitError = (error: any) =>
    error.response?.data?.error?.details?.map((detail: { message?: string }) => detail.message).join(
      " ",
    ) ||
    error.response?.data?.message ||
    "Erreur lors de l'enregistrement";

  const createMutation = useMutation({
    mutationFn: () => createEquipement(buildPayload()),
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      setErrors({
        submit: getSubmitError(error),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => updateEquipement(equipement!.id, buildPayload()),
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      setErrors({
        submit: getSubmitError(error),
      });
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (equipement) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handleInputChange = (field: keyof CreateEquipementRequest, value: string | string[]) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (field === "categorieId") {
        next.sousCategorieId = undefined;
        next.tailleId = undefined;
        next.repereId = undefined;
        next.pieceIds = [];
      }

      if (field === "sousCategorieId") {
        next.tailleId = undefined;
        next.repereId = undefined;
        next.pieceIds = [];
      }

      if (field === "tailleId") {
        next.repereId = undefined;
        next.pieceIds = [];
      }

      if (field === "repereId") {
        next.pieceIds = [];
      }

      return next;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="flex h-full w-full flex-col p-0 sm:max-w-4xl">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle>
            {equipement ? "Modifier l'équipement" : "Ajouter un équipement"}
          </SheetTitle>
          <SheetDescription>
            {equipement
              ? "Mettez à jour les informations de l'équipement"
              : "Remplissez les informations du nouvel équipement dans un panneau organisé."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-6 px-6 py-5">
              <section className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold">Informations générales</h3>
                  <p className="text-xs text-muted-foreground">
                    Identité et état principal de l'équipement.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Code *" error={errors.code}>
                    <Input
                      value={formData.code}
                      onChange={(e) => handleInputChange("code", e.target.value)}
                      placeholder="Ex: EQ-001"
                      disabled={isLoading}
                      className={errors.code ? "border-destructive" : ""}
                    />
                  </Field>
                  <Field label="Désignation *" error={errors.designation}>
                    <Input
                      value={formData.designation}
                      onChange={(e) => handleInputChange("designation", e.target.value)}
                      placeholder="Ex: Pompe hydraulique"
                      disabled={isLoading}
                      className={errors.designation ? "border-destructive" : ""}
                    />
                  </Field>
                  <Field label="Localisation *" error={errors.localisation}>
                    <Input
                      value={formData.localisation}
                      onChange={(e) => handleInputChange("localisation", e.target.value)}
                      placeholder="Ex: Atelier A, Bâtiment 2"
                      disabled={isLoading}
                      className={errors.localisation ? "border-destructive" : ""}
                    />
                  </Field>
                  <Field label="Fabricant">
                    <Input
                      value={formData.fabricant}
                      onChange={(e) => handleInputChange("fabricant", e.target.value)}
                      placeholder="Ex: Siemens"
                      disabled={isLoading}
                    />
                  </Field>
                  <Field label="Date d'installation">
                    <Input
                      type="date"
                      value={formData.dateInstallation}
                      onChange={(e) => handleInputChange("dateInstallation", e.target.value)}
                      disabled={isLoading}
                    />
                  </Field>
                  <Field label="Statut *">
                    <Select
                      value={formData.statut}
                      onValueChange={(v) => handleInputChange("statut", v)}
                    >
                      <SelectTrigger disabled={isLoading}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EN_SERVICE">En service</SelectItem>
                        <SelectItem value="EN_MAINTENANCE">En maintenance</SelectItem>
                        <SelectItem value="EN_ARRET">En arrêt</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </section>

              <section className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold">Hiérarchie technique</h3>
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez le chemin complet de l'équipement.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Catégorie *" error={errors.categorieId}>
                    <Select
                      value={formData.categorieId}
                      onValueChange={(v) => handleInputChange("categorieId", v)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={errors.categorieId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Sous-catégorie *" error={errors.sousCategorieId}>
                    <Select
                      value={formData.sousCategorieId}
                      onValueChange={(v) => handleInputChange("sousCategorieId", v)}
                      disabled={isLoading || !formData.categorieId}
                    >
                      <SelectTrigger
                        className={errors.sousCategorieId ? "border-destructive" : ""}
                      >
                        <SelectValue placeholder="Sélectionner une sous-catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSousCategories.map((sc) => (
                          <SelectItem key={sc.id} value={sc.id}>
                            {sc.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Taille *" error={errors.tailleId}>
                    <Select
                      value={formData.tailleId}
                      onValueChange={(v) => handleInputChange("tailleId", v)}
                      disabled={isLoading || !formData.sousCategorieId}
                    >
                      <SelectTrigger className={errors.tailleId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Sélectionner une taille" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTailles.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Repère *" error={errors.repereId}>
                    <Select
                      value={formData.repereId}
                      onValueChange={(v) => handleInputChange("repereId", v)}
                      disabled={isLoading || !formData.tailleId}
                    >
                      <SelectTrigger className={errors.repereId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Sélectionner un repère" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredReperes.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.code} {r.designation ? `- ${r.designation}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {formData.categorieId && (
                    <Badge variant="secondary">
                      {categories.find((item) => item.id === formData.categorieId)?.nom}
                    </Badge>
                  )}
                  {formData.sousCategorieId && (
                    <Badge variant="secondary">
                      {sousCategories.find((item) => item.id === formData.sousCategorieId)?.nom}
                    </Badge>
                  )}
                  {formData.tailleId && (
                    <Badge variant="secondary">
                      {tailles.find((item) => item.id === formData.tailleId)?.label}
                    </Badge>
                  )}
                  {formData.repereId && (
                    <Badge variant="secondary">
                      {reperes.find((item) => item.id === formData.repereId)?.code}
                    </Badge>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold">Pièces liées</h3>
                  <p className="text-xs text-muted-foreground">
                    Ajoutez les pièces compatibles avec le repère sélectionné.
                  </p>
                </div>
                <Field label="Pièces">
                  <Select
                    value=""
                    onValueChange={(v) => {
                      if (!formData.pieceIds?.includes(v)) {
                        handleInputChange("pieceIds", [...(formData.pieceIds || []), v]);
                      }
                    }}
                    disabled={isLoading || !formData.repereId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ajouter une pièce" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPieces.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.code} - {p.designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="mt-4 flex flex-wrap gap-2">
                  {formData.pieceIds?.length ? (
                    formData.pieceIds.map((pieceId) => {
                      const piece = pieces.find((p) => p.id === pieceId);
                      return piece ? (
                        <span
                          key={piece.id}
                          className="inline-flex items-center gap-2 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                        >
                          {piece.designation}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1"
                            onClick={() =>
                              handleInputChange(
                                "pieceIds",
                                formData.pieceIds?.filter((id) => id !== pieceId) || [],
                              )
                            }
                          >
                            x
                          </Button>
                        </span>
                      ) : null;
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">Aucune pièce sélectionnée.</p>
                  )}
                </div>
              </section>

              {errors.submit && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {errors.submit}
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="sticky bottom-0 mt-auto flex items-center justify-between border-t border-border bg-background px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Les champs marqués d'un * sont obligatoires.
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "En cours..." : equipement ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
