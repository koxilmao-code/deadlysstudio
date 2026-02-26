import { useParams } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { type TeamMember } from "@/lib/auth";
import { TaskCard } from "@/components/TaskCard";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { Code, Palette, Megaphone, Loader2 } from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; icon: any; description: string }> = {
  scripter: { label: "Scripter", icon: Code, description: "Logic-heavy tasks, bugs, and performance issues" },
  designer: { label: "Designer", icon: Palette, description: "UI tasks, UX feedback, and visual polish" },
  promoter: { label: "Promoter", icon: Megaphone, description: "Promo tasks, release deadlines, and asset previews" },
};

interface Props {
  currentUser: TeamMember;
}

export default function RoleDashboard({ currentUser }: Props) {
  const { role } = useParams<{ role: string }>();
  const { data: tasks, isLoading } = useTasks();

  const config = ROLE_CONFIG[role || ""] || ROLE_CONFIG.scripter;
  const Icon = config.icon;

  const filtered = tasks?.filter(t => t.role_category === role || t.role_category === "general") ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-mono font-bold text-lg">{config.label} Dashboard</h1>
            <p className="text-xs font-mono text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <CreateTaskDialog currentUser={currentUser} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-mono text-muted-foreground text-sm">No tasks for this role yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} currentUser={currentUser} />
          ))}
        </div>
      )}
    </div>
  );
}
