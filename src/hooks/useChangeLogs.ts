import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChangeLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changes: any;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
  changer?: { username: string } | null;
}

export function useChangeLogs(entityId?: string) {
  return useQuery({
    queryKey: ["change-logs", entityId],
    queryFn: async () => {
      let q = supabase
        .from("change_logs")
        .select(`*, changer:team_members!change_logs_changed_by_fkey(username)`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (entityId) q = q.eq("entity_id", entityId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ChangeLog[];
    },
  });
}
