import { supabase } from "@/integrations/supabase/client";

const TEAM_PASSWORD = "deadly2024";

export const STORAGE_KEY = "deadly_studio_member";

export interface TeamMember {
  id: string;
  username: string;
}

export function getStoredMember(): TeamMember | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function storeMember(member: TeamMember) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
}

export function clearMember() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function signInAnonymously() {
  // We use a shared anonymous session for the team
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "team@deadlystudio.dev",
    password: TEAM_PASSWORD,
  });
  if (error && error.message.includes("Invalid login")) {
    // Create the shared account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: "team@deadlystudio.dev",
      password: TEAM_PASSWORD,
    });
    if (signUpError) throw signUpError;
    return signUpData;
  }
  if (error) throw error;
  return data;
}

export async function joinTeam(username: string, teamPassword: string): Promise<TeamMember> {
  if (teamPassword !== TEAM_PASSWORD) {
    throw new Error("Invalid team password");
  }

  // Ensure we have an authenticated session
  await signInAnonymously();

  // Check if username exists
  const { data: existing } = await supabase
    .from("team_members")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    const member = { id: existing.id, username: existing.username };
    storeMember(member);
    return member;
  }

  // Create new member
  const { data: newMember, error } = await supabase
    .from("team_members")
    .insert({ username })
    .select()
    .single();

  if (error) throw error;

  const member = { id: newMember.id, username: newMember.username };
  storeMember(member);
  return member;
}
