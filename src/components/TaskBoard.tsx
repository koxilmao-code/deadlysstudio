import { useState } from "react";
import { useTasks, type TaskStatus } from "@/hooks/useTasks";
import { type TeamMember } from "@/lib/auth";
import { TaskCard } from "./TaskCard";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Skull, LogOut, Loader2 } from "lucide-react";

const FILTERS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "claimed", label: "Claimed" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

interface Props {
  currentUser: TeamMember;
  onLogout: () => void;
}

export function TaskBoard({ currentUser, onLogout }: Props) {
  const { data: tasks, isLoading } = useTasks();
  const [filter, setFilter] = useState<TaskStatus | "all">("all");

  const filtered = tasks?.filter((t) => filter === "all" || t.status === filter) ?? [];

  const counts = {
    all: tasks?.length ?? 0,
    open: tasks?.filter((t) => t.status === "open").length ?? 0,
    claimed: tasks?.filter((t) => t.status === "claimed").length ?? 0,
    in_progress: tasks?.filter((t) => t.status === "in_progress").length ?? 0,
    done: tasks?.filter((t) => t.status === "done").length ?? 0,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-primary" />
            <h1 className="font-mono font-bold text-sm">Deadly's Studio</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground">
              {currentUser.username}
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout} className="h-7 w-7 p-0">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(f.value)}
                className="font-mono text-xs h-7 px-3 flex-shrink-0"
              >
                {f.label}
                <span className="ml-1.5 opacity-60">{counts[f.value]}</span>
              </Button>
            ))}
          </div>
          <CreateTaskDialog currentUser={currentUser} />
        </div>

        {/* Task List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-mono text-muted-foreground text-sm">
              {filter === "all" ? "No tasks yet. Create one!" : `No ${filter.replace("_", " ")} tasks`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => (
              <TaskCard key={task.id} task={task} currentUser={currentUser} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
