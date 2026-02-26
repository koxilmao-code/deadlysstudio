import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WikiPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: { username: string } | null;
  updater?: { username: string } | null;
}

export const WIKI_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "coding_standards", label: "Coding Standards" },
  { value: "architecture", label: "Architecture" },
  { value: "combat", label: "Combat System" },
  { value: "networking", label: "Networking" },
  { value: "performance", label: "Performance" },
  { value: "naming", label: "Naming Conventions" },
  { value: "folder_structure", label: "Folder Structure" },
] as const;

export function useWikiPages() {
  return useQuery({
    queryKey: ["wiki"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wiki_pages")
        .select(`*, creator:team_members!wiki_pages_created_by_fkey(username), updater:team_members!wiki_pages_updated_by_fkey(username)`)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as WikiPage[];
    },
  });
}

export function useWikiPage(slug: string | undefined) {
  return useQuery({
    queryKey: ["wiki", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wiki_pages")
        .select(`*, creator:team_members!wiki_pages_created_by_fkey(username), updater:team_members!wiki_pages_updated_by_fkey(username)`)
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data as WikiPage;
    },
  });
}

export function useCreateWikiPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (page: { title: string; slug: string; content: string; category: string; created_by: string }) => {
      const { error } = await supabase.from("wiki_pages").insert({ ...page, updated_by: page.created_by });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wiki"] }),
  });
}

export function useUpdateWikiPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; content?: string; title?: string; category?: string; updated_by: string }) => {
      const { error } = await supabase.from("wiki_pages").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wiki"] }),
  });
}

export function useDeleteWikiPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wiki_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wiki"] }),
  });
}
