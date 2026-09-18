import { z } from "zod";

const robloxGameUrl = z.string().trim().url("Enter a valid Roblox game link").max(500).refine((value) => {
  try {
    const url = new URL(value);
    return ["roblox.com", "www.roblox.com"].includes(url.hostname) && /^\/games\/\d+/.test(url.pathname);
  } catch {
    return false;
  }
}, "Use a roblox.com/games link");

export const reviewSchema = z.object({
  studio_name: z.string().trim().min(2, "Enter your studio or developer name").max(100),
  contact_email: z.string().trim().email("Enter a valid email address").max(254),
  game_url: robloxGameUrl,
  game_stage: z.enum(["concept", "alpha", "beta", "live"]),
  primary_goal: z.enum(["retention", "monetization", "acquisition", "live-ops", "overall-strategy"]),
  context: z.string().trim().max(2000, "Keep the context under 2,000 characters").optional(),
});

export const applicationSchema = z.object({
  role_slug: z.enum(["acquisition-executive", "live-operations"]),
  applicant_name: z.string().trim().min(2, "Enter your name").max(100),
  contact_email: z.string().trim().email("Enter a valid email address").max(254),
  profile_url: z.string().trim().url("Enter a full portfolio or profile link").max(500).refine((value) => value.startsWith("https://"), "Use a secure https:// link"),
  note: z.string().trim().min(20, "Tell us a little more about your experience").max(2000),
});

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again";
}