import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const PLAN_PRICES: Record<string, string> = {
  starter: "price_1ULusYPi82s3aVAlaFgEkC8G",
  premium: "price_1ULuscPi82s3aVAlcAnk7n9h",
};
export const PRODUCT_TIERS: Record<string, "starter" | "premium"> = {
  prod_VMeAO5U7ZKcxO0: "starter",
  prod_VMeA2iPrDdOn6s: "premium",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

export function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

export function stripe() {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Billing is not configured");
  return new Stripe(key, { apiVersion: "2025-08-27.basil" });
}

export async function requireUser(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!token) throw new Error("Sign in required");
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user?.email) throw new Error("Sign in required");
  return data.user;
}

export async function findCustomer(s: Stripe, email: string) {
  const list = await s.customers.list({ email, limit: 1 });
  return list.data[0]?.id ?? null;
}
