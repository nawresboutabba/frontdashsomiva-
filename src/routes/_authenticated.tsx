import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/layouts/AppShell";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => {
    const { token } = useAuthStore.getState();
    if (!token) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
