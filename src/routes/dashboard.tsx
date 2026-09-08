import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) nav({ to: "/login" });
    else if (role) nav({ to: `/${role}/dashboard` as never });
  }, [user, role, loading, nav]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
