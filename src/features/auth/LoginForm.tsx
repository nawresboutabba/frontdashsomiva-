import { useState, type FormEvent } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Factory, KeyRound, Loader2, ShieldAlert, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/api/endpoints/auth";
import { useAuthStore } from "@/store/authStore";
import { ROLE_HOME, ROLE_LABEL } from "@/utils/rbac";

const DEMO_ACCOUNTS = [
  { email: "admin@somiva.com", password: "Admin@123456", label: "Administrateur" },
  { email: "magasinier@somiva.com", password: "Magasinier@123456", label: "Magasinier" },
  {
    email: "maintenance@somiva.com",
    password: "Maintenance@123456",
    label: "Resp. Maintenance",
  },
  { email: "consultation@somiva.com", password: "Consultation@123456", label: "Consultation" },
];

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      const target = search?.redirect || ROLE_HOME[data.user.role];
      navigate({ to: target });
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const errorMsg = mutation.error
    ? ((mutation.error as unknown as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? "Identifiants invalides")
    : null;

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1fr_minmax(420px,560px)]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:block">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--sidebar-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--sidebar-foreground) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Factory className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">SOMIVA EAM</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
                Gestion d'équipements · Enrichissement Phosphate
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-sidebar-primary">
              Système EAM / GMAO
            </div>
            <h1 className="mt-3 max-w-md text-4xl font-bold leading-tight">
              Pilotez vos opérations industrielles avec précision.
            </h1>
            <p className="mt-4 max-w-md text-sm text-sidebar-foreground/70">
              Suivi des équipements, gestion du stock pièces de rechange, supervision
              maintenance et audit complet — en temps réel.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-sidebar-border">
              {[
                { k: "Équipements", v: "12" },
                { k: "Pièces", v: "200+" },
                { k: "Uptime", v: "99.4%" },
              ].map((s) => (
                <div key={s.k} className="bg-sidebar-accent/40 p-4">
                  <div className="font-mono text-2xl font-bold tracking-tight">{s.v}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
                    {s.k}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/40">
            © SOMIVA · v1.0.0
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Factory className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-bold">SOMIVA EAM</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Système de gestion
                </div>
              </div>
            </div>
          </div>

          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Authentification
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Connexion</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Saisissez vos identifiants pour accéder au tableau de bord.
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 pl-9"
                  placeholder="admin@somiva.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider">
                Mot de passe
              </Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 pl-9"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button type="submit" className="h-10 w-full" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion…
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          
        </div>
      </div>
    </div>
  );
}
