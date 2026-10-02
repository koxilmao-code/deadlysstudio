import { admin, cors, json, PRODUCT_TIERS, requireUser, stripe, findCustomer } from "../_shared/billing.ts";

// Syncs the caller's plan from Stripe (the trusted source) into the database.
// Enterprise plans are assigned manually by staff and are never downgraded here.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const user = await requireUser(req);
    const db = admin();
    const { data: current } = await db.from("subscriptions").select("tier").eq("user_id", user.id).maybeSingle();
    if (current?.tier === "enterprise") return json({ tier: "enterprise" });

    const s = stripe();
    const customer = await findCustomer(s, user.email!);
    let row: Record<string, unknown> = {
      user_id: user.id, tier: "free", status: "active", stripe_customer_id: customer, stripe_subscription_id: null,
    };
    if (customer) {
      const subs = await s.subscriptions.list({ customer, status: "active", limit: 5 });
      const sub = subs.data.find((x) => PRODUCT_TIERS[String(x.items.data[0]?.price.product)]);
      if (sub) {
        const item = sub.items.data[0];
        const start = (item as any).current_period_start ?? (sub as any).current_period_start;
        const end = (item as any).current_period_end ?? (sub as any).current_period_end;
        row = {
          ...row,
          tier: PRODUCT_TIERS[String(item.price.product)],
          status: sub.status,
          stripe_subscription_id: sub.id,
          current_period_start: new Date(start * 1000).toISOString(),
          current_period_end: new Date(end * 1000).toISOString(),
        };
      }
    }
    if (row.tier === "free") {
      const now = new Date();
      row.current_period_start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      row.current_period_end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
    }
    const { error } = await db.from("subscriptions").upsert(row);
    if (error) throw error;
    return json({ tier: row.tier, current_period_end: row.current_period_end });
  } catch (e) {
    console.error("[check-subscription]", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
