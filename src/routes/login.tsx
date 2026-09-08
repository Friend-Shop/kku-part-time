import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Logo } from "@/components/layout/Logo";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "เข้าสู่ระบบ — KKU PART-TiME" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && role) nav({ to: `/${role}/dashboard` as never });
  }, [user, role, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();
      const resolvedRole = roleRow?.role ?? data.user.user_metadata?.role;
      if (resolvedRole === "student" || resolvedRole === "employer") {
        toast.success(t("auth.welcome_back"));
        nav({ to: `/${resolvedRole}/dashboard` as never });
      } else {
        toast.error("บัญชีนี้ยังไม่มีสิทธิ์ Student หรือ Employer ใน KKU PART-TiME");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <Logo className="h-9 w-9" iconClassName="h-5 w-5" />
          <span className="font-display text-xl font-bold">KKU PART-TiME</span>
        </Link>
        <h1 className="font-display text-3xl font-bold">ยินดีต้อนรับสู่ KKU PART-TiME</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.login_subtitle")}
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">{t("auth.email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">{t("auth.password")}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 font-display font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("auth.sign_in")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.new_here")}{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            {t("auth.create_account")}
          </Link>
        </p>
      </div>
    </div>
  );
}
