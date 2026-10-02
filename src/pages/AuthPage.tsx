import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/exchange");

export default function AuthPage() {
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const { session } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (session) navigate(next, { replace: true }); }, [session, next, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return setMsg({ ok: false, text: parsed.error.issues[0].message });
    setBusy(true); setMsg(null);
    const { email: em, password: pw } = parsed.data;
    const { error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email: em, password: pw })
      : await supabase.auth.signUp({ email: em, password: pw, options: { emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(next)}` } });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    if (mode === "up") setMsg({ ok: true, text: "Check your inbox to confirm your email, then sign in." });
  };

  const google = async () => {
    sessionStorage.setItem("auth_next", next);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) setMsg({ ok: false, text: r.error.message });
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("auth_next");
    if (session && stored) { sessionStorage.removeItem("auth_next"); navigate(safeNext(stored), { replace: true }); }
  }, [session, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-sm font-semibold uppercase">Deadly’s Studio</Link>
        <h1 className="mt-10 text-3xl font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Creator Exchange — analytics, creative services and marketplace.</p>
        <Button variant="outline" className="mt-8 w-full rounded-none" onClick={google}>Continue with Google</Button>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-4">
          <div><Label htmlFor="em">Email</Label><Input id="em" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 rounded-none" /></div>
          <div><Label htmlFor="pw">Password</Label><Input id="pw" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 rounded-none" /></div>
          {msg && <p className={`text-sm ${msg.ok ? "text-foreground" : "text-destructive"}`} role="status">{msg.text}</p>}
          <Button type="submit" disabled={busy} className="w-full rounded-none">{busy ? "…" : mode === "in" ? "Sign in" : "Create account"}</Button>
        </form>
        <button className="mt-6 text-xs text-muted-foreground hover:text-foreground" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
          {mode === "in" ? "No account? Create one" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
