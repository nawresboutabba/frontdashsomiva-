import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "@/features/auth/LoginForm";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion · SOMIVA EAM" },
      { name: "description", content: "Accès au tableau de bord SOMIVA EAM — gestion d'équipements industriels." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  beforeLoad: ({ search }) => {
    const { token } = useAuthStore.getState();
    if (token) throw redirect({ to: search.redirect || "/" });
  },
  component: LoginForm,
});
