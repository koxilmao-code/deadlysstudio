import { cors, json, requireUser, stripe, findCustomer } from "../_shared/billing.ts";
import { returnOrigin } from "../_shared/access.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const user = await requireUser(req);
    const s = stripe();
    const customer = await findCustomer(s, user.email!);
    if (!customer) return json({ error: "No billing account yet — upgrade first." }, 400);
    const origin = returnOrigin(req.headers.get("origin"));
    const portal = await s.billingPortal.sessions.create({ customer, return_url: `${origin}/exchange/subscription` });
    return json({ url: portal.url });
  } catch (e) {
    console.error("[customer-portal]", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
