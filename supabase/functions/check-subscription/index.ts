import { admin, cors, json, requireUser } from "../_shared/billing.ts";
import { effectiveTier } from "../_shared/access.ts";

// Read-only: reports the caller's plan. Plans are changed only by the signed Stripe webhook.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const user = await requireUser(req);
    const { data } = await admin().from("subscriptions")
      .select("tier,status,current_period_end,stripe_subscription_id").eq("user_id", user.id).maybeSingle();
    return json({ tier: effectiveTier(data as any), current_period_end: data?.current_period_end ?? null });
  } catch (e) {
    console.error("[check-subscription]", e);
    return json({ error: "Sign in required" }, 401);
  }
});
