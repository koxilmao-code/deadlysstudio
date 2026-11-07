import { admin, json, PRODUCT_TIERS, stripe } from "../_shared/billing.ts";

// Only Stripe-signed events may change a customer's plan.
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return json({ error: "Unauthorized" }, 401);
  const s = stripe();
  let event;
  try {
    event = await s.webhooks.constructEventAsync(await req.text(), sig, secret);
  } catch {
    return json({ error: "Invalid signature" }, 400);
  }
  try {
    if (!event.type.startsWith("customer.subscription.")) return json({ received: true });
    const sub = event.data.object as any;
    const db = admin();
    const customer = String(sub.customer);
    let userId: string | null = sub.metadata?.user_id ?? null;
    if (!userId) {
      const { data } = await db.from("subscriptions").select("user_id").eq("stripe_customer_id", customer).maybeSingle();
      userId = data?.user_id ?? null;
    }
    if (!userId) return json({ received: true, skipped: "unknown customer" });

    const item = sub.items?.data?.[0];
    const tier = PRODUCT_TIERS[String(item?.price?.product)];
    const active = tier && (sub.status === "active" || sub.status === "trialing") && event.type !== "customer.subscription.deleted";
    const now = new Date();
    const start = item?.current_period_start ?? sub.current_period_start;
    const end = item?.current_period_end ?? sub.current_period_end;
    const row = active
      ? { user_id: userId, tier, status: sub.status, stripe_customer_id: customer, stripe_subscription_id: sub.id,
          current_period_start: new Date(start * 1000).toISOString(), current_period_end: new Date(end * 1000).toISOString() }
      : { user_id: userId, tier: "free", status: "active", stripe_customer_id: customer, stripe_subscription_id: null,
          current_period_start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
          current_period_end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString() };
    const { error } = await db.from("subscriptions").upsert(row);
    if (error) throw error;
    return json({ received: true });
  } catch (e) {
    console.error("[stripe-webhook]", e);
    return json({ error: "Processing failed" }, 500);
  }
});
