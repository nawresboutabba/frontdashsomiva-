import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Boxes,
  ChevronLeft,
  Factory,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Search,
  Wrench,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { ROLE_LABEL } from "@/utils/rbac";
import { getKPIs } from "@/api/endpoints/dashboard";
import type { Role } from "@/api/types";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
};

const NAV: NavItem[] = [
  {
    to: "/",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MAGASINIER", "RESPONSABLE_MAINTENANCE", "CONSULTATION"],
  },
  {
    to: "/equipements",
    label: "Équipements",
    icon: Wrench,
    roles: ["ADMIN", "RESPONSABLE_MAINTENANCE", "CONSULTATION"],
  },
  {
    to: "/stock",
    label: "Stock",
    icon: Boxes,
    roles: ["ADMIN", "MAGASINIER", "RESPONSABLE_MAINTENANCE", "CONSULTATION"],
  },
  {
    to: "/audit",
    label: "Audit",
    icon: Activity,
    roles: ["ADMIN"],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: kpis } = useQuery({ queryKey: ["kpis"], queryFn: getKPIs });
  const alerts = kpis?.piecesSousStockMin ?? 0;

  const onLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const initials = user?.fullName
    ?.split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "U";

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "sticky top-0 z-30 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Factory className="h-5 w-5" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">SOMIVA</div>
              <div className="truncate text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
                EAM · Enrichissement
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className={cn("mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/50", sidebarCollapsed && "sr-only")}>
            Navigation
          </div>
          <ul className="space-y-0.5">
            {NAV.filter((n) => !user || n.roles.includes(user.role)).map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    {!sidebarCollapsed && item.to === "/stock" && alerts > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-[10px]">
                        {alerts}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
            {!sidebarCollapsed && <span className="text-xs">Réduire</span>}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={toggleSidebar}>
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono uppercase tracking-wider">SOMIVA</span>
            <span>/</span>
            <span className="font-medium text-foreground">
              {NAV.find((n) => n.to === pathname)?.label ?? "Accueil"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher équipement, pièce, repère…"
                className="h-9 w-72 pl-8 text-sm"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-4 w-4" />
                  {alerts > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground">
                      {alerts}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b border-border px-3 py-2 text-sm font-semibold">
                  Alertes
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {alerts === 0 ? (
                    <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                      Aucune alerte
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs">
                        <div className="font-semibold text-destructive">
                          {alerts} pièce{alerts > 1 ? "s" : ""} sous stock minimum
                        </div>
                        <div className="text-muted-foreground">
                          Vérifier le module Stock pour réapprovisionnement.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <div className="text-xs font-semibold leading-tight">{user?.fullName}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {user ? ROLE_LABEL[user.role] : ""}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-semibold">{user?.fullName}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="mx-auto max-w-[1600px] px-4 py-5 md:px-6 md:py-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
