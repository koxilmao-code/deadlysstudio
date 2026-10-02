import { cors, json, PLAN_PRICES, requireUser, stripe, findCustomer } from "../_shared/billing.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const user = await requireUser(req);
    const { plan } = await req.json().catch(() => ({}));
    const price = PLAN_PRICES[plan];
    if (!price) return json({ error: "Unknown plan" }, 400);
    const s = stripe();
    const customer = await findCustomer(s, user.email!);
    const origin = req.headers.get("origin") ?? "https://outrunservice.lovable.app";
    const session = await s.checkout.sessions.create({
      customer: customer ?? undefined,
      customer_email: customer ? undefined : user.email,
      line_items: [{ price, quantity: 1 }],
      mode: "subscription",
      client_reference_id: user.id,
      success_url: `${origin}/exchange/subscription?checkout=success`,
      cancel_url: `${origin}/exchange/subscription?checkout=cancel`,
    });
    return json({ url: session.url });
  } catch (e) {
    console.error("[create-checkout]", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
