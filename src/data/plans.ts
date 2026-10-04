import type { Tier } from "@/hooks/useSession";

/** checkout = plan key sent to billing; "scale" is stored as the enterprise tier. */
export interface Plan { tier: Tier; name: string; price: string; note: string; checkout?: "starter" | "premium" | "scale"; features: string[]; featured?: boolean }

export const PLANS: Plan[] = [
  { tier: "guest", name: "Guest", price: "$0", note: "No login required", features: ["Search any Roblox game", "Live player counts & CCU graphs", "View marketplace listings"] },
  { tier: "free", name: "Free", price: "$0", note: "Sign in required", features: ["Everything in Guest", "Basic engagement stats", "Post games for sale", "Ad-free experience"] },
  { tier: "starter", name: "Starter", price: "$15", note: "per month", checkout: "starter", features: ["Everything in Free", "Full Trending feed", "Player engagement metrics", "Advanced & revenue analytics", "2 human-made thumbnails / month", "A/B testing included"] },
  { tier: "premium", name: "Premium", price: "$79", note: "per month · $49 on holidays", checkout: "premium", featured: true, features: ["Everything in Starter", "4 human-made thumbnails / month", "A/B testing included"] },
  { tier: "enterprise", name: "Scale", price: "$149", note: "per month", checkout: "scale", features: ["Everything in Premium", "6 human-made thumbnails / month", "2 human-made trailers / month", "A/B testing included", "Tailored analytics solutions"] },
];
