import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle,
  Boxes,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ROLE_LABEL } from "@/utils/rbac";
import type { AuditAction, AuditEvent } from "@/api/types";

const ICONS: Record<AuditAction, { icon: LucideIcon; color: string }> = {
  "auth.login": { icon: LogIn, color: "text-info bg-info/15" },
  "auth.logout": { icon: LogOut, color: "text-muted-foreground bg-muted" },
  "equipement.update": { icon: Pencil, color: "text-primary bg-primary/15" },
  "equipement.create": { icon: Plus, color: "text-success bg-success/15" },
  "stock.adjust": { icon: Boxes, color: "text-warning bg-warning/15" },
  "stock.alert": { icon: AlertTriangle, color: "text-destructive bg-destructive/15" },
  "piece.update": { icon: Wrench, color: "text-chart-5 bg-chart-5/15" },
};

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <div className="text-sm font-semibold">Flux d'activité</div>
        <div className="text-[11px] text-muted-foreground">
          Journal d'audit · {events.length} événements
        </div>
      </div>
      <ol className="relative p-4">
        <span
          className="absolute left-[26px] top-4 bottom-4 w-px bg-border"
          aria-hidden
        />
        {events.map((e) => {
          const { icon: Icon, color } = ICONS[e.action];
          const initials = e.user
            .split(" ")
            .map((s) => s[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          return (
            <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
              <div
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-card",
                  color,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 rounded-md border border-border bg-background/50 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{e.user}</span>
                  <Badge variant="outline" className="h-4 px-1 text-[9px]">
                    {ROLE_LABEL[e.role]}
                  </Badge>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {formatDistanceToNow(parseISO(e.timestamp), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>
                <div className="mt-1.5 text-sm">{e.details}</div>
                <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>{e.action}</span>
                  {e.entityId && (
                    <>
                      <span>·</span>
                      <span className="font-mono normal-case">{e.entityId}</span>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
