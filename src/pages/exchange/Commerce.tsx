import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession, atLeast, type Tier } from "@/hooks/useSession";
import { COMPAT_LABEL, LISTING_CATEGORIES, PLATFORMS } from "@/lib/platforms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Gate, GamePicker, NoGames, PageHead, Panel, SignInPrompt, Stat, tierName, useMyGames, type Game } from "./kit";
import { useCredits } from "./Overview";

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const httpUrl = z.string().trim().url().max(500).refine((u) => /^https:\/\//.test(u), "Must start with https://");

/* ---------------- Marketplace ---------------- */
const listingSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(3000),
  price_usd: z.coerce.number().min(0).max(1_000_000),
  contact_url: httpUrl.optional().or(z.literal("")),
  image_url: httpUrl.optional().or(z.literal("")),
});

export function Marketplace() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [cat, setCat] = useState("all");
  const [compat, setCompat] = useState("all");
  const [search, setSearch] = useState("");
  const [f, setF] = useState({ title: "", description: "", price_usd: "0", contact_url: "", image_url: "", category: "assets", compatibility: "roblox" });
  const list = useQuery({
    queryKey: ["listings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketplace_listings").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  const rows = (list.data ?? []).filter((l) => (cat === "all" || l.category === cat) && (compat === "all" || l.compatibility === compat) && (!search || l.title.toLowerCase().includes(search.toLowerCase())));

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = listingSchema.safeParse(f);
    if (!p.success) return toast.error(p.error.issues[0].message);
    const { error } = await supabase.from("marketplace_listings").insert({
      seller_id: session!.user.id, title: p.data.title, description: p.data.description, price_usd: p.data.price_usd,
      contact_url: p.data.contact_url || null, image_url: p.data.image_url || null,
      category: f.category, compatibility: f.compatibility as "roblox" | "uefn" | "multi",
    });
    if (error) return toast.error(error.message);
    toast.success("Listing published");
    setF({ ...f, title: "", description: "", price_usd: "0", contact_url: "", image_url: "" });
    qc.invalidateQueries({ queryKey: ["listings"] });
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("marketplace_listings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["listings"] });
  };

  return (
    <>
      <PageHead index="04 / Marketplace" title="Marketplace" desc="Games, assets and services from Exchange creators. Platform compatibility is declared by the seller.">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-40 rounded-none" />
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 border border-border bg-background px-3 text-sm"><option value="all">All categories</option>{LISTING_CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select value={compat} onChange={(e) => setCompat(e.target.value)} className="h-9 border border-border bg-background px-3 text-sm"><option value="all">All platforms</option>{Object.entries(COMPAT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
      </PageHead>
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="grid gap-px border border-border bg-border sm:grid-cols-2 2xl:grid-cols-3">
          {rows.length ? rows.map((l) => (
            <article key={l.id} className="flex flex-col bg-card p-4">
              {l.image_url && <img src={l.image_url} alt="" loading="lazy" className="mb-3 aspect-video w-full object-cover" />}
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="border border-border px-1.5 py-0.5">{COMPAT_LABEL[l.compatibility as keyof typeof COMPAT_LABEL]}</span>
                <span>{LISTING_CATEGORIES.find(([k]) => k === l.category)?.[1]}</span>
              </div>
              <h3 className="mt-2 font-semibold">{l.title}</h3>
              <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted-foreground">{l.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-mono">{Number(l.price_usd) === 0 ? "Free" : `$${Number(l.price_usd).toFixed(2)}`}</span>
                <div className="flex gap-2">
                  <Link to={`/creator/${l.seller_id}`} className="text-xs text-muted-foreground hover:text-foreground">Seller</Link>
                  {l.contact_url && <a href={l.contact_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">Contact</a>}
                  {session?.user.id === l.seller_id && <button onClick={() => remove(l.id)} className="text-xs text-destructive">Delete</button>}
                </div>
              </div>
            </article>
          )) : <p className="bg-card p-6 text-sm text-muted-foreground sm:col-span-2 2xl:col-span-3">{list.isLoading ? "Loading…" : "No listings match."}</p>}
        </div>
        {session ? (
          <Panel title="Post a listing">
            <form onSubmit={create} className="space-y-3">
              <Input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="rounded-none" />
              <div className="flex gap-2">
                <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="h-9 flex-1 border border-border bg-background px-2 text-sm">{LISTING_CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                <select value={f.compatibility} onChange={(e) => setF({ ...f, compatibility: e.target.value })} className="h-9 flex-1 border border-border bg-background px-2 text-sm">{Object.entries(COMPAT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              </div>
              <Input type="number" min={0} step="0.01" placeholder="Price (USD)" value={f.price_usd} onChange={(e) => setF({ ...f, price_usd: e.target.value })} className="rounded-none" />
              <Textarea placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={3000} className="rounded-none" />
              <Input placeholder="Image URL (https://)" value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} className="rounded-none" />
              <Input placeholder="Contact / purchase URL (https://)" value={f.contact_url} onChange={(e) => setF({ ...f, contact_url: e.target.value })} className="rounded-none" />
              <p className="text-[11px] text-muted-foreground">Only declare platforms your item actually supports.</p>
              <Button type="submit" className="w-full rounded-none">Publish</Button>
            </form>
          </Panel>
        ) : <SignInPrompt next="/exchange/marketplace" />}
      </div>
    </>
  );
}

/* ---------------- Creative Studio ---------------- */
const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted", reviewing: "Reviewing", in_progress: "In Progress", awaiting_info: "Awaiting Information",
  ready_for_review: "Ready for Review", revision_requested: "Revision Requested", completed: "Completed",
};
export const statusLabel = (s: string) => STATUS_LABEL[s] ?? s;

const FIELDS = {
  thumbnail: [["current", "Current thumbnail URL"], ["style", "Desired style"], ["references", "Reference image URLs"], ["elements", "Important elements"], ["text", "Text requirements"], ["colors", "Color preferences"], ["description", "Description"], ["notes", "Additional notes"]],
  trailer: [["length", "Desired length (e.g. 30s)"], ["footage", "Game footage links"], ["references", "Reference trailers"], ["style", "Style"], ["music", "Music preference"], ["text", "On-screen text"], ["voiceover", "Voiceover requirements"], ["moments", "Key gameplay moments"], ["notes", "Additional notes"]],
} as const;

export function CreativeStudio() {
  const { session, tier } = useSession();
  const games = useMyGames();
  const credits = useCredits();
  const qc = useQueryClient();
  const [kind, setKind] = useState<"thumbnail" | "trailer">("thumbnail");
  const [gid, setGid] = useState<string>();
  const [brief, setBrief] = useState<Record<string, string>>({});
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const reqs = useQuery({
    queryKey: ["my-requests", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("creative_requests").select("*, games(name)").eq("user_id", session!.user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const c = credits.data?.find((x) => x.kind === kind);
  const remaining = c ? Math.max(c.allowance - c.used, 0) : 0;
  const gameId = gid ?? games.data?.[0]?.id;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId) return;
    const clean = Object.fromEntries(Object.entries(brief).map(([k, v]) => [k, v.trim().slice(0, 2000)]).filter(([, v]) => v));
    if (!clean.description && !clean.style && !clean.moments) return toast.error("Describe what you need (style, description or key moments).");
    setBusy(true);
    const { data, error } = await supabase.rpc("submit_creative_request", { _game_id: gameId, _kind: kind, _brief: clean, _preferred_date: date || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Request #${(data as any).request_number} submitted`);
    setBrief({}); setDate("");
    qc.invalidateQueries({ queryKey: ["my-requests"] }); qc.invalidateQueries({ queryKey: ["credits"] });
  };
  const revise = async (id: string) => {
    const note = prompt("What should be changed?");
    if (!note) return;
    const { error } = await supabase.rpc("request_creative_revision", { _request_id: id, _note: note });
    if (error) return toast.error(error.message);
    toast.success("Revision requested");
    qc.invalidateQueries({ queryKey: ["my-requests"] });
  };

  return (
    <>
      <PageHead index="05 / Creative Studio" title="Creative Studio" desc="Human-made thumbnails and trailers from the Deadly's Studio creative team." />
      <Gate min="starter" next="/exchange/creative">
        <div className="mb-6 grid grid-cols-2 border border-border bg-card">
          {credits.data?.map((x) => <Stat key={x.kind} label={`${x.kind} credits`} value={`${Math.max(x.allowance - x.used, 0)} / ${x.allowance}`} hint={`remaining · resets each billing cycle`} />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
          <Panel title="Your requests">
            {!reqs.data?.length ? <p className="text-sm text-muted-foreground">No requests yet.</p> : (
              <div className="divide-y divide-border">
                {reqs.data.map((r: any) => (
                  <div key={r.id} className="grid gap-1 py-3 text-sm md:grid-cols-[6rem_1fr_auto]">
                    <span className="font-mono">#{r.request_number}</span>
                    <div>
                      <p>{r.games?.name} · <span className="capitalize">{r.kind}</span></p>
                      <p className="text-xs text-muted-foreground">Submitted {new Date(r.created_at).toLocaleDateString()}{r.expected_delivery && ` · Expected ${new Date(r.expected_delivery).toLocaleDateString()}`}</p>
                      {r.staff_message && <p className="mt-1 text-xs">Studio: {r.staff_message}</p>}
                      {r.deliverable_url && <a href={r.deliverable_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs underline">Download deliverable</a>}
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="border border-border px-2 py-0.5 text-[11px] uppercase">{statusLabel(r.status)}</span>
                      {["ready_for_review", "completed"].includes(r.status) && <Button size="sm" variant="outline" className="h-6 rounded-none text-[11px]" onClick={() => revise(r.id)}>Request revision</Button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="New request">
            {!games.data?.length ? <NoGames /> : (
              <form onSubmit={submit} className="space-y-3">
                <div className="flex gap-2">
                  {(["thumbnail", "trailer"] as const).map((k) => (
                    <button type="button" key={k} onClick={() => setKind(k)} disabled={k === "trailer" && !atLeast(tier, "enterprise")}
                      className={`flex-1 border px-3 py-2 text-xs capitalize ${kind === k ? "border-foreground" : "border-border text-muted-foreground"} disabled:opacity-40`}>
                      {k}{k === "trailer" && !atLeast(tier, "enterprise") && " · Enterprise"}
                    </button>
                  ))}
                </div>
                <GamePicker games={games.data} value={gameId} onChange={setGid} />
                {FIELDS[kind].map(([k, l]) => (
                  <Textarea key={k} placeholder={l} rows={k === "description" || k === "moments" ? 3 : 1} value={brief[k] ?? ""} onChange={(e) => setBrief({ ...brief, [k]: e.target.value })} maxLength={2000} className="min-h-0 rounded-none" />
                ))}
                <label className="block text-xs text-muted-foreground">Preferred delivery date
                  <Input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 rounded-none" />
                </label>
                <Button type="submit" disabled={busy || remaining < 1} className="w-full rounded-none">
                  {remaining < 1 ? "No credits remaining" : `Request ${kind} · ${remaining} left`}
                </Button>
              </form>
            )}
          </Panel>
        </div>
      </Gate>
    </>
  );
}

/* ---------------- A/B Testing ---------------- */
const MIN_IMPRESSIONS = 1000;
/** Two-proportion z-test. Returns null when either arm lacks data. */
export function compareRates(ia: number, ca: number, ib: number, cb: number) {
  if (ia <= 0 || ib <= 0) return null;
  const pa = ca / ia, pb = cb / ib, p = (ca + cb) / (ia + ib);
  const se = Math.sqrt(p * (1 - p) * (1 / ia + 1 / ib));
  const z = se ? (pb - pa) / se : 0;
  return { pa, pb, lift: pa ? (pb - pa) / pa : null, z, enough: ia >= MIN_IMPRESSIONS && ib >= MIN_IMPRESSIONS, significant: Math.abs(z) >= 1.96 };
}

export function ABTesting() {
  const { session } = useSession();
  const games = useMyGames();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", asset_type: "thumbnail", variant_a: "", variant_b: "" });
  const [gid, setGid] = useState<string>();
  const tests = useQuery({
    queryKey: ["ab", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("ab_tests").select("*, games(name)").eq("user_id", session!.user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const gameId = gid ?? games.data?.[0]?.id;
    if (!gameId || f.name.trim().length < 2 || !f.variant_a.trim() || !f.variant_b.trim()) return toast.error("Fill in name and both variants");
    const { error } = await supabase.from("ab_tests").insert({
      user_id: session!.user.id, game_id: gameId, name: f.name.trim().slice(0, 120), asset_type: f.asset_type as any,
      variant_a: f.variant_a.trim().slice(0, 500), variant_b: f.variant_b.trim().slice(0, 500),
    });
    if (error) return toast.error(error.message);
    setF({ ...f, name: "", variant_a: "", variant_b: "" });
    qc.invalidateQueries({ queryKey: ["ab"] });
  };
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("ab_tests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["ab"] });
  };
  return (
    <>
      <PageHead index="06 / A/B Testing" title="A/B Testing" desc="Compare creative variants. Results are recorded from platform data — no winner is declared without enough evidence." />
      <Gate min="starter" next="/exchange/ab-tests">
        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <div className="space-y-4">
            {!tests.data?.length && <Panel><p className="text-sm text-muted-foreground">No tests yet.</p></Panel>}
            {tests.data?.map((t: any) => {
              const ctr = compareRates(t.impressions_a, t.clicks_a, t.impressions_b, t.clicks_b);
              const eng = compareRates(t.impressions_a, t.engaged_a, t.impressions_b, t.engaged_b);
              return (
                <Panel key={t.id} title={`A/B Test #${t.test_number} · ${t.name} · ${t.games?.name ?? ""}`}>
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-[11px] uppercase text-muted-foreground"><th className="pb-2" /><th>Version A</th><th>Version B</th></tr></thead>
                    <tbody>
                      <tr className="border-t border-border"><td className="py-2 text-muted-foreground">Variant</td><td className="break-all text-xs">{t.variant_a}</td><td className="break-all text-xs">{t.variant_b}</td></tr>
                      <tr className="border-t border-border"><td className="py-2 text-muted-foreground">Impressions</td><td className="font-mono">{t.impressions_a.toLocaleString()}</td><td className="font-mono">{t.impressions_b.toLocaleString()}</td></tr>
                      <tr className="border-t border-border"><td className="py-2 text-muted-foreground">CTR</td><td className="font-mono">{ctr ? `${(ctr.pa * 100).toFixed(2)}%` : "—"}</td><td className="font-mono">{ctr ? `${(ctr.pb * 100).toFixed(2)}%` : "—"}</td></tr>
                      <tr className="border-t border-border"><td className="py-2 text-muted-foreground">Engagement</td><td className="font-mono">{eng ? `${(eng.pa * 100).toFixed(2)}%` : "—"}</td><td className="font-mono">{eng ? `${(eng.pb * 100).toFixed(2)}%` : "—"}</td></tr>
                    </tbody>
                  </table>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <p className="text-muted-foreground">
                      {!ctr ? "No impressions recorded yet." : !ctr.enough ? `Insufficient data — each version needs at least ${MIN_IMPRESSIONS.toLocaleString()} impressions.` :
                        `Current CTR difference (B vs A): ${ctr.lift == null ? "—" : `${ctr.lift >= 0 ? "+" : ""}${(ctr.lift * 100).toFixed(1)}%`} · ${ctr.significant ? "statistically reliable (95%)" : "not yet statistically reliable"}`}
                    </p>
                    <div className="flex gap-2">
                      <span className="border border-border px-2 py-0.5 uppercase">{t.status}</span>
                      {t.status === "draft" && <Button size="sm" variant="outline" className="h-6 rounded-none text-[11px]" onClick={() => setStatus(t.id, "running")}>Start</Button>}
                      {t.status === "running" && <Button size="sm" variant="outline" className="h-6 rounded-none text-[11px]" onClick={() => setStatus(t.id, "ended")}>End</Button>}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
          <Panel title="New test">
            {!games.data?.length ? <NoGames /> : (
              <form onSubmit={create} className="space-y-3">
                <Input placeholder="Test name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="rounded-none" />
                <GamePicker games={games.data} value={gid ?? games.data[0].id} onChange={setGid} />
                <select value={f.asset_type} onChange={(e) => setF({ ...f, asset_type: e.target.value })} className="h-9 w-full border border-border bg-background px-3 text-sm">
                  {["thumbnail", "icon", "title", "promo", "trailer"].map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <Input placeholder="Version A (URL or text)" value={f.variant_a} onChange={(e) => setF({ ...f, variant_a: e.target.value })} className="rounded-none" />
                <Input placeholder="Version B (URL or text)" value={f.variant_b} onChange={(e) => setF({ ...f, variant_b: e.target.value })} className="rounded-none" />
                <Button type="submit" className="w-full rounded-none">Create test</Button>
              </form>
            )}
          </Panel>
        </div>
      </Gate>
    </>
  );
}

/* ---------------- Subscription ---------------- */
const PLANS: { id: Tier; price: string; features: string[] }[] = [
  { id: "free", price: "$0", features: ["Basic engagement stats", "Post games for sale", "Creator profile", "Basic game management"] },
  { id: "starter", price: "$5/mo", features: ["Full Trending feed", "Player engagement & advanced analytics", "Revenue analytics", "2 human-made thumbnails / month", "A/B testing", "Competitor insights"] },
  { id: "premium", price: "$35/mo", features: ["Everything in Starter", "4 human-made thumbnails / month", "Expanded analytics & insights", "Detailed revenue analytics"] },
  { id: "enterprise", price: "Custom", features: ["Everything in Premium", "Full game development support", "8 thumbnails / month", "2 human-made trailers / month", "Custom reporting & dedicated support"] },
];

export function Subscription() {
  const { session, tier, periodEnd, refreshPlan } = useSession();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    if (params.get("checkout") === "success") { toast.success("Payment received — updating your plan"); refreshPlan(true); }
  }, [params, refreshPlan]);
  const go = async (fn: "create-checkout" | "customer-portal", plan?: string) => {
    setBusy(plan ?? fn);
    try {
      const { data, error } = await supabase.functions.invoke(fn, { body: plan ? { plan } : {} });
      if (error) {
        const ctx = (error as any).context;
        throw new Error(ctx?.json ? (await ctx.json()).error : error.message);
      }
      if (data?.error) throw new Error(data.error);
      window.open(data.url, "_blank", "noopener");
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(null); }
  };
  return (
    <>
      <PageHead index="10 / Subscription" title="Subscription" desc={session ? `Current plan: ${tierName(tier)}${periodEnd && tier !== "free" ? ` · renews ${new Date(periodEnd).toLocaleDateString()}` : ""}` : "Choose a plan."}>
        {session && <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-none" onClick={() => refreshPlan(true)}>Refresh status</Button>
          {tier !== "free" && tier !== "enterprise" && <Button size="sm" className="rounded-none" disabled={!!busy} onClick={() => go("customer-portal")}>Manage billing</Button>}
        </div>}
      </PageHead>
      <div className="grid gap-px border border-border bg-border md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p) => {
          const current = session && tier === p.id;
          return (
            <div key={p.id} className={`flex flex-col bg-card p-5 ${current ? "outline outline-1 outline-foreground" : ""}`}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{tierName(p.id)}{current && " · Your plan"}</p>
              <p className="mt-2 font-mono text-2xl">{p.price}</p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-muted-foreground">{p.features.map((x) => <li key={x}>— {x}</li>)}</ul>
              <div className="mt-6">
                {!session ? <Button asChild className="w-full rounded-none" variant="outline"><Link to="/auth?next=/exchange/subscription">Sign in</Link></Button>
                  : current ? <Button disabled className="w-full rounded-none" variant="outline">Current plan</Button>
                  : p.id === "enterprise" ? <Button asChild className="w-full rounded-none" variant="outline"><a href="mailto:hello@deadlystudio.dev?subject=Enterprise%20plan">Contact sales</a></Button>
                  : p.id === "free" ? (tier !== "enterprise" ? <Button className="w-full rounded-none" variant="outline" disabled={!!busy} onClick={() => go("customer-portal")}>Downgrade via billing</Button> : null)
                  : <Button className="w-full rounded-none" disabled={!!busy} onClick={() => go("create-checkout", p.id)}>{busy === p.id ? "Opening…" : atLeast(tier, p.id) ? "Switch" : "Upgrade"}</Button>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Guests (no account) can browse the marketplace, public games and creator profiles. Payments are processed securely by Stripe.</p>
    </>
  );
}

/* ---------------- Public creator profile ---------------- */
export function CreatorProfile() {
  const { id } = useParams();
  const { session } = useSession();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["creator", id],
    enabled: !!id,
    queryFn: async () => {
      const [p, g, l] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id!).maybeSingle(),
        supabase.from("games").select("*").eq("creator_id", id!).eq("is_public", true),
        supabase.from("marketplace_listings").select("*").eq("seller_id", id!).eq("is_active", true),
      ]);
      return { profile: p.data, games: (g.data ?? []) as Game[], listings: l.data ?? [] };
    },
  });
  const own = session?.user.id === id;
  const [edit, setEdit] = useState<{ display_name: string; bio: string; services: string; avatar_url: string } | null>(null);
  const save = async () => {
    if (!edit) return;
    const name = edit.display_name.trim();
    if (name.length < 2 || name.length > 60) return toast.error("Name must be 2–60 characters");
    if (edit.avatar_url && !/^https:\/\//.test(edit.avatar_url)) return toast.error("Image must be an https:// URL");
    const { error } = await supabase.from("profiles").update({ display_name: name, bio: edit.bio.slice(0, 1000), services: edit.services.slice(0, 500), avatar_url: edit.avatar_url || null }).eq("id", id!);
    if (error) return toast.error(error.message);
    setEdit(null); qc.invalidateQueries({ queryKey: ["creator", id] });
  };
  if (q.isLoading) return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
  const p = q.data?.profile;
  if (!p) return <div className="p-8"><Panel><p className="text-sm text-muted-foreground">This creator profile is private or does not exist.</p></Panel></div>;
  const platforms = [...new Set(q.data!.games.map((g) => PLATFORMS[g.platform].label))];
  return (
    <div className="studio-shell py-10">
      <Link to="/exchange" className="text-xs text-muted-foreground hover:text-foreground">← Creator Exchange</Link>
      <div className="mt-6 flex items-center gap-5 border-b border-border pb-8">
        {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-20 w-20 object-cover" /> : <div className="flex h-20 w-20 items-center justify-center border border-border text-2xl">{p.display_name[0]}</div>}
        <div className="flex-1">
          <h1 className="text-3xl font-semibold">{p.display_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{platforms.join(" · ") || "No public games yet"}</p>
        </div>
        {own && !edit && <Button variant="outline" className="rounded-none" onClick={() => setEdit({ display_name: p.display_name, bio: p.bio ?? "", services: p.services ?? "", avatar_url: p.avatar_url ?? "" })}>Edit profile</Button>}
      </div>
      {edit && (
        <Panel title="Edit profile" className="mt-6">
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Display name" value={edit.display_name} onChange={(e) => setEdit({ ...edit, display_name: e.target.value })} className="rounded-none" />
            <Input placeholder="Profile image URL (https://)" value={edit.avatar_url} onChange={(e) => setEdit({ ...edit, avatar_url: e.target.value })} className="rounded-none" />
            <Textarea placeholder="Bio" value={edit.bio} onChange={(e) => setEdit({ ...edit, bio: e.target.value })} className="rounded-none" />
            <Textarea placeholder="Services offered" value={edit.services} onChange={(e) => setEdit({ ...edit, services: e.target.value })} className="rounded-none" />
          </div>
          <div className="mt-3 flex gap-2"><Button className="rounded-none" onClick={save}>Save</Button><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div>
        </Panel>
      )}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Panel title="About" className="lg:col-span-1">
          <p className="whitespace-pre-line text-sm text-muted-foreground">{p.bio || "No bio yet."}</p>
          {p.services && <><p className="mt-4 text-xs uppercase text-muted-foreground">Services</p><p className="mt-1 whitespace-pre-line text-sm">{p.services}</p></>}
        </Panel>
        <Panel title="Games" className="lg:col-span-2">
          {q.data!.games.length ? <ul className="divide-y divide-border text-sm">{q.data!.games.map((g) => (
            <li key={g.id} className="flex justify-between py-2"><a className="hover:underline" href={PLATFORMS[g.platform].gameUrl(g.external_game_id)} target="_blank" rel="noreferrer">{g.name}</a><span className="text-xs text-muted-foreground">{PLATFORMS[g.platform].label} · {g.genre}</span></li>
          ))}</ul> : <p className="text-sm text-muted-foreground">No public games.</p>}
        </Panel>
        <Panel title="Marketplace listings" className="lg:col-span-3">
          {q.data!.listings.length ? <ul className="divide-y divide-border text-sm">{q.data!.listings.map((l) => (
            <li key={l.id} className="flex justify-between py-2"><span>{l.title}</span><span className="font-mono text-xs">{Number(l.price_usd) === 0 ? "Free" : `$${Number(l.price_usd).toFixed(2)}`} · {COMPAT_LABEL[l.compatibility as keyof typeof COMPAT_LABEL]}</span></li>
          ))}</ul> : <p className="text-sm text-muted-foreground">No active listings.</p>}
        </Panel>
      </div>
    </div>
  );
}
