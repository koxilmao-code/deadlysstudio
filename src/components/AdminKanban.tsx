import { useState } from "react";
import { Calendar, GripVertical, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { useTasks, useUpdateTask, type Task, type TaskStatus } from "@/hooks/useTasks";
import type { TeamMember } from "@/lib/auth";

const columns: { title: string; status: TaskStatus }[] = [
  { title: "Backlog", status: "open" },
  { title: "In Progress", status: "in_progress" },
  { title: "Review", status: "claimed" },
  { title: "Completed", status: "done" },
];

function KanbanCard({ task }: { task: Task }) {
  const navigate = useNavigate();
  return (
    <article draggable onDragStart={event => event.dataTransfer.setData("text/task-id", task.id)} className="cursor-grab border border-border bg-card p-4 active:cursor-grabbing">
      <div className="flex items-start justify-between gap-3"><span className="text-[10px] uppercase text-muted-foreground">{task.role_category}</span><GripVertical className="h-4 w-4 text-muted-foreground" /></div>
      <button type="button" onClick={() => navigate(`/admin/task/${task.id}`)} className="mt-3 text-left text-sm font-medium leading-snug hover:underline">{task.title}</button>
      <div className="mt-5 flex items-center justify-between text-[10px] uppercase text-muted-foreground"><span>{task.priority}</span>{task.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(task.deadline), "MMM d")}</span>}</div>
    </article>
  );
}

export function AdminKanban({ currentUser }: { currentUser: TeamMember }) {
  const { data: tasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const [activeDrop, setActiveDrop] = useState<TaskStatus | null>(null);

  const drop = (event: React.DragEvent, status: TaskStatus) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/task-id");
    setActiveDrop(null);
    if (id) updateTask.mutate({ id, status });
  };

  if (isLoading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <section>
      <div className="mb-8 flex items-end justify-between"><div><p className="section-index">Workspace / Tasks</p><h2 className="mt-2 text-3xl font-medium">Production board</h2></div><CreateTaskDialog currentUser={currentUser} /></div>
      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map(column => {
          const entries = tasks?.filter(task => task.status === column.status) ?? [];
          return <div key={column.status} onDragOver={event => { event.preventDefault(); setActiveDrop(column.status); }} onDragLeave={() => setActiveDrop(null)} onDrop={event => drop(event, column.status)} className={`min-h-[28rem] border border-border p-3 transition-colors ${activeDrop === column.status ? "bg-secondary" : "bg-background"}`}>
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3"><h3 className="text-xs font-medium uppercase">{column.title}</h3><span className="text-xs text-muted-foreground">{entries.length}</span></div>
            <div className="space-y-3">{entries.map(task => <KanbanCard key={task.id} task={task} />)}</div>
          </div>;
        })}
      </div>
    </section>
  );
}