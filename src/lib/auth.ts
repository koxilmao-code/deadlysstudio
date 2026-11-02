import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface TeamMember {
  id: string;
  username: string;
}

/** Returns the caller's workspace identity, linking it on first visit. Database rules only allow staff. */
export async function ensureStaffMember(user: User): Promise<TeamMember> {
  const { data: found, error: findErr } = await supabase
    .from("team_members").select("id,username").eq("user_id", user.id).maybeSingle();
  if (findErr) throw findErr;
  if (found) return found;

  const meta = user.user_metadata ?? {};
  const raw = String(meta.full_name ?? meta.display_name ?? user.email?.split("@")[0] ?? "Staff");
  const username = raw.trim().slice(0, 40) || "Staff";
  const { data, error } = await supabase
    .from("team_members").insert({ user_id: user.id, username }).select("id,username").single();
  if (error) throw error;
  return data;
}
