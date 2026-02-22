import { type Task, type TaskStatus, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { type TeamMember } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, User, Trash2, ChevronDown, AlertTriangle, Circle, Zap, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<TaskStatus, { label: string; class: string }> = {
  open: { label: "Open", class: "status-open" },
  claimed: { label: "Claimed", class: "status-claimed" },
  in_progress: { label: "In Progress", class: "status-in-progress" },
  done: { label: "Done", class: "status-done" },
};

const PRIORITY_ICONS = {
  low: Circle,
  medium: Zap,
  high: AlertTriangle,
  urgent: Flame,
};

interface TaskCardProps {
  task: Task;
  currentUser: TeamMember;
}

export function TaskCard({ task, currentUser }: TaskCardProps) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const statusConfig = STATUS_CONFIG[task.status];
  const PriorityIcon = PRIORITY_ICONS[task.priority];

  const handleClaim = () => {
    updateTask.mutate({ id: task.id, status: "claimed", assigned_to: currentUser.id });
  };

  const handleStatusChange = (status: TaskStatus) => {
    const updates: any = { id: task.id, status };
    if (status === "open") updates.assigned_to = null;
    if (status === "claimed" || status === "in_progress") {
      updates.assigned_to = task.assigned_to || currentUser.id;
    }
    updateTask.mutate(updates);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 card-hover animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <PriorityIcon className={`w-3.5 h-3.5 flex-shrink-0 priority-${task.priority}`} />
            <h3 className="font-mono font-semibold text-sm text-foreground truncate">
              {task.title}
            </h3>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${statusConfig.class} flex-shrink-0`}>
          {statusConfig.label}
        </span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
          {task.assignee && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.assignee.username}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {task.status === "open" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClaim}
              className="h-6 text-[10px] font-mono border-primary/30 text-primary hover:bg-primary/10"
            >
              Claim
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-mono text-xs">
              {(["open", "claimed", "in_progress", "done"] as TaskStatus[])
                .filter((s) => s !== task.status)
                .map((s) => (
                  <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                    Mark as {STATUS_CONFIG[s].label}
                  </DropdownMenuItem>
                ))}
              <DropdownMenuItem
                onClick={() => deleteTask.mutate(task.id)}
                className="text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
