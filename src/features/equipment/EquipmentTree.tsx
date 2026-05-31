import { useMemo, useState } from "react";
import { ChevronRight, Box, Boxes, Layers, Search, Tag, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EquipementTreeData } from "@/api/endpoints/equipements";
import type { Equipement, Piece } from "@/api/types";

export type TreeSelection =
  | { type: "equipement"; data: Equipement }
  | { type: "piece"; data: Piece }
  | { type: "generic"; label: string; sub?: string };

interface Props {
  data: EquipementTreeData;
  onSelect: (sel: TreeSelection) => void;
}

const STATUS_BADGE: Record<string, string> = {
  EN_SERVICE: "bg-success/15 text-success border-success/30",
  EN_MAINTENANCE: "bg-warning/15 text-warning border-warning/30",
  EN_ARRET: "bg-destructive/15 text-destructive border-destructive/30",
};

export function EquipmentTree({ data, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const matches = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    const m = new Set<string>();
    for (const e of data.equipements)
      if (e.code.toLowerCase().includes(q) || e.nom.toLowerCase().includes(q)) m.add(e.id);
    for (const c of data.categories) if (c.nom.toLowerCase().includes(q)) m.add(c.id);
    for (const sc of data.sousCategories) if (sc.nom.toLowerCase().includes(q)) m.add(sc.id);
    for (const r of data.reperes)
      if (r.code.toLowerCase().includes(q) || r.designation.toLowerCase().includes(q)) m.add(r.id);
    for (const p of data.pieces)
      if (p.code.toLowerCase().includes(q) || p.designation.toLowerCase().includes(q)) m.add(p.id);
    return m;
  }, [query, data]);

  // auto-expand ancestors of matches
  const autoExpand = useMemo(() => {
    if (!matches) return null;
    const a = new Set<string>();
    for (const p of data.pieces) {
      if (matches.has(p.id)) {
        const r = data.reperes.find((x) => x.id === p.repereId);
        const t = r && data.tailles.find((x) => x.id === r.tailleId);
        const sc = t && data.sousCategories.find((x) => x.id === t.sousCategorieId);
        const c = sc && data.categories.find((x) => x.id === sc.categorieId);
        if (r) a.add(r.id);
        if (t) a.add(t.id);
        if (sc) a.add(sc.id);
        if (c) {
          a.add(c.id);
          a.add(c.equipementId);
        }
      }
    }
    for (const r of data.reperes) {
      if (matches.has(r.id)) {
        const t = data.tailles.find((x) => x.id === r.tailleId);
        const sc = t && data.sousCategories.find((x) => x.id === t.sousCategorieId);
        const c = sc && data.categories.find((x) => x.id === sc.categorieId);
        if (t) a.add(t.id);
        if (sc) a.add(sc.id);
        if (c) {
          a.add(c.id);
          a.add(c.equipementId);
        }
      }
    }
    return a;
  }, [matches, data]);

  const isOpen = (id: string) => expanded.has(id) || autoExpand?.has(id);
  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const visible = (id: string) => !matches || matches.has(id) || autoExpand?.has(id);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher code, désignation…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-[13px]">
        {data.equipements.filter((e) => visible(e.id)).map((eq) => (
          <div key={eq.id} className="select-none">
            <Row
              level={0}
              open={!!isOpen(eq.id)}
              onToggle={() => toggle(eq.id)}
              onClick={() => onSelect({ type: "equipement", data: eq })}
              icon={<Wrench className="h-3.5 w-3.5 text-primary" />}
              label={
                <>
                  <span className="font-semibold">{eq.code}</span>
                  <span className="ml-2 font-sans text-foreground/80">{eq.nom}</span>
                </>
              }
              right={
                <Badge
                  variant="outline"
                  className={cn("h-5 border px-1.5 text-[9px] font-semibold uppercase", STATUS_BADGE[eq.statut])}
                >
                  {eq.statut.replace("_", " ")}
                </Badge>
              }
              highlight={matches?.has(eq.id)}
            />
            {isOpen(eq.id) &&
              data.categories
                .filter((c) => c.equipementId === eq.id && visible(c.id))
                .map((cat) => (
                  <div key={cat.id}>
                    <Row
                      level={1}
                      open={!!isOpen(cat.id)}
                      onToggle={() => toggle(cat.id)}
                      onClick={() =>
                        onSelect({ type: "generic", label: cat.nom, sub: "Catégorie" })
                      }
                      icon={<Tag className="h-3.5 w-3.5 text-info" />}
                      label={<span className="font-sans">{cat.nom}</span>}
                      highlight={matches?.has(cat.id)}
                    />
                    {isOpen(cat.id) &&
                      data.sousCategories
                        .filter((sc) => sc.categorieId === cat.id && visible(sc.id))
                        .map((sc) => (
                          <div key={sc.id}>
                            <Row
                              level={2}
                              open={!!isOpen(sc.id)}
                              onToggle={() => toggle(sc.id)}
                              onClick={() =>
                                onSelect({
                                  type: "generic",
                                  label: sc.nom,
                                  sub: "Sous-catégorie",
                                })
                              }
                              icon={<Layers className="h-3.5 w-3.5 text-chart-5" />}
                              label={<span className="font-sans">{sc.nom}</span>}
                              highlight={matches?.has(sc.id)}
                            />
                            {isOpen(sc.id) &&
                              data.tailles
                                .filter((t) => t.sousCategorieId === sc.id && visible(t.id))
                                .map((t) => (
                                  <div key={t.id}>
                                    <Row
                                      level={3}
                                      open={!!isOpen(t.id)}
                                      onToggle={() => toggle(t.id)}
                                      onClick={() =>
                                        onSelect({
                                          type: "generic",
                                          label: `Taille ${t.label}`,
                                          sub: "Taille",
                                        })
                                      }
                                      icon={<Box className="h-3.5 w-3.5 text-muted-foreground" />}
                                      label={<span className="font-sans">Taille {t.label}</span>}
                                      highlight={matches?.has(t.id)}
                                    />
                                    {isOpen(t.id) &&
                                      data.reperes
                                        .filter((r) => r.tailleId === t.id && visible(r.id))
                                        .map((r) => (
                                          <div key={r.id}>
                                            <Row
                                              level={4}
                                              open={!!isOpen(r.id)}
                                              onToggle={() => toggle(r.id)}
                                              onClick={() =>
                                                onSelect({
                                                  type: "generic",
                                                  label: r.code,
                                                  sub: r.designation,
                                                })
                                              }
                                              icon={
                                                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                                              }
                                              label={
                                                <>
                                                  <span className="font-semibold">{r.code}</span>
                                                  <span className="ml-2 font-sans text-muted-foreground">
                                                    {r.designation}
                                                  </span>
                                                </>
                                              }
                                              highlight={matches?.has(r.id)}
                                            />
                                            {isOpen(r.id) &&
                                              data.pieces
                                                .filter(
                                                  (p) =>
                                                    p.repereId === r.id && visible(p.id),
                                                )
                                                .map((p) => (
                                                  <Row
                                                    key={p.id}
                                                    level={5}
                                                    leaf
                                                    onClick={() =>
                                                      onSelect({ type: "piece", data: p })
                                                    }
                                                    icon={
                                                      <Boxes
                                                        className={cn(
                                                          "h-3.5 w-3.5",
                                                          p.stock < p.stockMin
                                                            ? "text-destructive"
                                                            : "text-success",
                                                        )}
                                                      />
                                                    }
                                                    label={
                                                      <>
                                                        <span className="font-semibold">
                                                          {p.code}
                                                        </span>
                                                        <span className="ml-2 font-sans text-muted-foreground">
                                                          {p.designation}
                                                        </span>
                                                      </>
                                                    }
                                                    right={
                                                      <span
                                                        className={cn(
                                                          "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                                                          p.stock < p.stockMin
                                                            ? "bg-destructive/15 text-destructive"
                                                            : "bg-muted text-muted-foreground",
                                                        )}
                                                      >
                                                        {p.stock} {p.unite}
                                                      </span>
                                                    }
                                                    highlight={matches?.has(p.id)}
                                                  />
                                                ))}
                                          </div>
                                        ))}
                                  </div>
                                ))}
                          </div>
                        ))}
                  </div>
                ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({
  level,
  open,
  leaf,
  onToggle,
  onClick,
  icon,
  label,
  right,
  highlight,
}: {
  level: number;
  open?: boolean;
  leaf?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  icon: React.ReactNode;
  label: React.ReactNode;
  right?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded px-1 py-1 transition-colors hover:bg-accent",
        highlight && "bg-primary/5",
      )}
      style={{ paddingLeft: 4 + level * 16 }}
    >
      {!leaf ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:bg-muted"
        >
          <ChevronRight
            className={cn("h-3 w-3 transition-transform", open && "rotate-90")}
          />
        </button>
      ) : (
        <span className="inline-block w-4" />
      )}
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      <button
        type="button"
        onClick={onClick}
        className="flex-1 truncate text-left"
      >
        {label}
      </button>
      {right}
    </div>
  );
}
