import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  variant?: "default" | "warning" | "danger" | "success";
  hint?: string;
  index?: number;
}

const variantStyles = {
  default: "border-border",
  warning: "border-warning/40 bg-warning/5",
  danger: "border-destructive/40 bg-destructive/5",
  success: "border-success/40 bg-success/5",
};
const iconBg = {
  default: "bg-primary/10 text-primary",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/15 text-destructive",
  success: "bg-success/15 text-success",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = "default",
  hint,
  index = 0,
}: Props) {
  const up = (trend ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md",
        variantStyles[variant],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 font-mono text-2xl font-bold leading-none tracking-tight">
            {value}
          </div>
          {hint && (
            <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div>
          )}
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", iconBg[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {typeof trend === "number" && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px]">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono font-semibold",
              up ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-muted-foreground">vs mois dernier</span>
        </div>
      )}

      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
}
