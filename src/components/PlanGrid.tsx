import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { PLANS } from "@/data/plans";
import { Button } from "@/components/ui/button";

export async function openBilling(fn: "create-checkout" | "customer-portal", plan?: string) {
  const { data, error } = await supabase.functions.invoke(fn, { body: plan ? { plan } : {} });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    throw new Error(ctx?.json ? (await ctx.json()).error : error.message);
  }
  if (data?.error) throw new Error(data.error);
  window.open(data.url, "_blank", "noopener");
}

export function PlanGrid({ next = "/pricing" }: { next?: string }) {
  const { session, tier } = useSession();
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (fn: "create-checkout" | "customer-portal", plan?: string) => {
    setBusy(plan ?? fn);
    try { await openBilling(fn, plan); } catch (e) { toast.error(e instanceof Error ? e.message : "Billing unavailable"); } finally { setBusy(null); }
  };
  return (
    <div className="grid gap-px border border-border bg-border sm:grid-cols-2 xl:grid-cols-5">
      {PLANS.map((p) => {
        const current = session ? tier === p.tier : p.tier === "guest";
        return (
          <div key={p.tier} className={`flex flex-col bg-card p-6 ${p.featured ? "bg-secondary" : ""}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase text-muted-foreground">Tier — {p.name}</p>
              {p.featured && <span className="border border-neon px-2 py-0.5 text-[10px] uppercase text-neon">Popular</span>}
            </div>
            <p className="mt-4 text-4xl font-medium">{p.price}</p>
            <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm text-muted-foreground">{p.features.map((f) => <li key={f} className="border-t border-border pt-2">{f}</li>)}</ul>
            <div className="mt-6">
              {current ? <Button disabled variant="outline" className="w-full rounded-none">{session ? "Your plan" : "You're here"}</Button>
                : !p.checkout ? (session ? null : <Button asChild variant="outline" className="w-full rounded-none"><Link to={`/auth?next=${next}`}>Sign in free</Link></Button>)
                : !session ? <Button asChild className="w-full rounded-none"><Link to={`/auth?next=${next}`}>Get {p.name}</Link></Button>
                : <Button className="w-full rounded-none" disabled={!!busy} onClick={() => run("create-checkout", p.checkout)}>{busy === p.checkout ? "Opening…" : `Get ${p.name}`}</Button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
