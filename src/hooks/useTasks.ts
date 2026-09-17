import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export type TaskStatus = "open" | "claimed" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskDifficulty = "easy" | "medium" | "hard" | "expert";
export type RoleCategory = "general" | "scripter" | "designer" | "promoter";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  role_category: RoleCategory;
  deadline: string | null;
  why_it_matters: string | null;
  common_mistakes: string | null;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  creator?: { username: string } | null;
  assignee?: { username: string } | null;
}

export interface TaskNote {
  id: string;
  task_id: string;
  author_id: string | null;
  content: string;
  note_type: "general" | "bug" | "edge_case" | "performance" | "hack" | "todo";
  created_at: string;
  updated_at: string;
  author?: { username: string } | null;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on: string;
  created_at: string;
  dependency?: { title: string; status: TaskStatus } | null;
}

export function useTasks() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          creator:team_members!tasks_created_by_fkey(username),
          assignee:team_members!tasks_assigned_to_fkey(username)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ["task", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          creator:team_members!tasks_created_by_fkey(username),
          assignee:team_members!tasks_assigned_to_fkey(username)
        `)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Task;
    },
  });
}

export function useTaskNotes(taskId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["task-notes", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_notes")
        .select(`*, author:team_members!task_notes_author_id_fkey(username)`)
        .eq("task_id", taskId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TaskNote[];
    },
  });

  useEffect(() => {
    if (!taskId) return;
    const channel = supabase
      .channel(`notes-${taskId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_notes", filter: `task_id=eq.${taskId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["task-notes", taskId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, taskId]);

  return query;
}

export function useTaskDependencies(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task-deps", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_dependencies")
        .select(`*, dependency:tasks!task_dependencies_depends_on_fkey(title, status)`)
        .eq("task_id", taskId!);
      if (error) throw error;
      return data as TaskDependency[];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      priority: TaskPriority;
      difficulty?: TaskDifficulty;
      role_category?: RoleCategory;
      deadline?: string;
      why_it_matters?: string;
      common_mistakes?: string;
      created_by: string;
    }) => {
      const { error } = await supabase.from("tasks").insert(task);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Omit<Task, "id" | "creator" | "assignee">>) => {
      const { error } = await supabase.from("tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: { task_id: string; author_id: string; content: string; note_type: string }) => {
      const { error } = await supabase.from("task_notes").insert(note);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["task-notes", vars.task_id] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, task_id }: { id: string; task_id: string }) => {
      const { error } = await supabase.from("task_notes").delete().eq("id", id);
      if (error) throw error;
      return task_id;
    },
    onSuccess: (task_id) => qc.invalidateQueries({ queryKey: ["task-notes", task_id] }),
  });
}

export function useAddDependency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ task_id, depends_on }: { task_id: string; depends_on: string }) => {
      const { error } = await supabase.from("task_dependencies").insert({ task_id, depends_on });
      if (error) throw error;
      return task_id;
    },
    onSuccess: (task_id) => qc.invalidateQueries({ queryKey: ["task-deps", task_id] }),
  });
}

export function useRemoveDependency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, task_id }: { id: string; task_id: string }) => {
      const { error } = await supabase.from("task_dependencies").delete().eq("id", id);
      if (error) throw error;
      return task_id;
    },
    onSuccess: (task_id) => qc.invalidateQueries({ queryKey: ["task-deps", task_id] }),
  });
}
