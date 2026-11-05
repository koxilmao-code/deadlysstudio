import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { teamRole, type TeamRole } from "@/lib/teamRoles";

export type Tier = "guest" | "free" | "starter" | "premium" | "enterprise";
export const TIER_RANK: Record<Tier, number> = { guest: -1, free: 0, starter: 1, premium: 2, enterprise: 3 };

interface Ctx {
  session: Session | null;
  ready: boolean;
  tier: Tier;
  periodEnd: string | null;
  isStaff: boolean;
  role: TeamRole | null;
  refreshPlan: (sync?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}
const SessionCtx = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tier, setTier] = useState<Tier>("guest");
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [role, setRole] = useState<TeamRole | null>(null);

  const refreshPlan = useCallback(async (sync = false) => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s) { setTier("guest"); setIsStaff(false); setRole(null); setPeriodEnd(null); return; }
    if (sync) await supabase.functions.invoke("check-subscription").catch(() => null);
    const [{ data: sub }, { data: roles }] = await Promise.all([
      supabase.from("subscriptions").select("tier,current_period_end").eq("user_id", s.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", s.user.id),
    ]);
    const { data: { session: current } } = await supabase.auth.getSession();
    if (current?.user.id !== s.user.id) return;
    setTier((sub?.tier as Tier) ?? "free");
    setPeriodEnd(sub?.current_period_end ?? null);
    const nextRole = teamRole(roles?.map((r) => r.role) ?? []);
    setRole(nextRole);
    setIsStaff(nextRole !== null);
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setRole(null);
      setIsStaff(false);
      setTimeout(() => refreshPlan(true), 0);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      refreshPlan(!!s).finally(() => setReady(true));
    });
    return () => data.subscription.unsubscribe();
  }, [refreshPlan]);

  const signOut = async () => { await supabase.auth.signOut(); setTier("guest"); setIsStaff(false); setRole(null); setPeriodEnd(null); };

  return (
    <SessionCtx.Provider value={{ session, ready, tier, periodEnd, isStaff, role, refreshPlan, signOut }}>
      {children}
    </SessionCtx.Provider>
  );
}

export function useSession() {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("useSession outside SessionProvider");
  return c;
}

export const atLeast = (t: Tier, min: Tier) => TIER_RANK[t] >= TIER_RANK[min];
