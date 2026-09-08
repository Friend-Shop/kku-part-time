import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Logo } from "@/components/layout/Logo";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "สมัครใช้งาน — KKU PART-TiME" }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "employer">("student");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — signing you in…");
    setTimeout(() => nav({ to: `/${role}/dashboard` as never }), 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <Logo className="h-9 w-9" iconClassName="h-5 w-5" />
          <span className="font-display text-xl font-bold">KKU PART-TiME</span>
        </Link>
        <h1 className="font-display text-3xl font-bold">{t("auth.register_title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.register_subtitle")}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg border border-border p-1">
          {([
            { v: "student", label: "นักศึกษา / Student" },
            { v: "employer", label: "นายจ้าง / Employer" },
          ] as const).map((r) => (
            <button
              key={r.v}
              type="button"
              onClick={() => setRole(r.v as any)}
              className={cn(
                "rounded-md py-2 text-xs font-semibold capitalize transition",
                role === r.v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">{t("auth.full_name")}</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
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
              minLength={6}
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
            {t("auth.sign_up")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.already_have_account")}{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t("auth.sign_in")}
          </Link>
        </p>
      </div>
    </div>
  );
}
