import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useTask, useTaskNotes, useTaskDependencies, useUpdateTask,
  useCreateNote, useDeleteNote, useAddDependency, useRemoveDependency,
  useTasks, type TaskStatus, type TaskNote,
} from "@/hooks/useTasks";
import { type TeamMember } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Clock, User, AlertTriangle, Circle, Zap, Flame,
  Calendar, Link2, Trash2, Plus, Bug, AlertCircle, Gauge, Wrench, ListTodo, MessageSquare,
  Loader2, Save,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const NOTE_TYPES = [
  { value: "general", label: "General", icon: MessageSquare },
  { value: "bug", label: "Bug Found", icon: Bug },
  { value: "edge_case", label: "Edge Case", icon: AlertCircle },
  { value: "performance", label: "Performance", icon: Gauge },
  { value: "hack", label: "Temp Hack", icon: Wrench },
  { value: "todo", label: "TODO", icon: ListTodo },
] as const;

const NOTE_COLORS: Record<string, string> = {
  general: "border-border",
  bug: "border-destructive/40",
  edge_case: "border-amber/40",
  performance: "border-cyan/40",
  hack: "border-amber/40",
  todo: "border-primary/40",
};

const PRIORITY_ICONS = { low: Circle, medium: Zap, high: AlertTriangle, urgent: Flame };
const STATUS_OPTIONS: TaskStatus[] = ["open", "claimed", "in_progress", "done"];
const STATUS_CONFIG: Record<TaskStatus, { label: string; class: string }> = {
  open: { label: "Open", class: "status-open" },
  claimed: { label: "Claimed", class: "status-claimed" },
  in_progress: { label: "In Progress", class: "status-in-progress" },
  done: { label: "Done", class: "status-done" },
};

interface Props {
  currentUser: TeamMember;
}

export default function TaskDetailPage({ currentUser }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(id);
  const { data: notes } = useTaskNotes(id);
  const { data: deps } = useTaskDependencies(id);
  const { data: allTasks } = useTasks();
  const updateTask = useUpdateTask();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const addDep = useAddDependency();
  const removeDep = useRemoveDependency();

  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<string>("general");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <p className="font-mono text-muted-foreground">Task not found</p>
        <Button variant="ghost" onClick={() => navigate("/")} className="mt-4 font-mono">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const PriorityIcon = PRIORITY_ICONS[task.priority];
  const availableDeps = allTasks?.filter(t => t.id !== task.id && !deps?.some(d => d.depends_on === t.id)) ?? [];

  const handleInlineEdit = (field: string, value: string) => {
    updateTask.mutate({ id: task.id, [field]: value || null });
    setEditing(null);
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    createNote.mutate(
      { task_id: task.id, author_id: currentUser.id, content: noteContent.trim(), note_type: noteType },
      { onSuccess: () => { setNoteContent(""); setNoteType("general"); } }
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate("/")} className="font-mono text-xs h-7 px-2 -ml-2">
        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Board
      </Button>

      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <PriorityIcon className={`w-5 h-5 priority-${task.priority}`} />
            <h1 className="text-xl font-mono font-bold text-foreground">{task.title}</h1>
          </div>
          <span className={`text-xs font-mono font-semibold px-3 py-1 rounded ${STATUS_CONFIG[task.status].class}`}>
            {STATUS_CONFIG[task.status].label}
          </span>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-muted-foreground uppercase tracking-wider">Status</span>
            <Select value={task.status} onValueChange={(v: TaskStatus) => updateTask.mutate({ id: task.id, status: v })}>
              <SelectTrigger className="mt-1 h-8 text-xs bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="text-muted-foreground uppercase tracking-wider">Priority</span>
            <Select value={task.priority} onValueChange={(v: TaskPriority) => updateTask.mutate({ id: task.id, priority: v })}>
              <SelectTrigger className="mt-1 h-8 text-xs bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["low", "medium", "high", "urgent"].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="text-muted-foreground uppercase tracking-wider">Difficulty</span>
            <Select value={task.difficulty} onValueChange={(v: TaskDifficulty) => updateTask.mutate({ id: task.id, difficulty: v })}>
              <SelectTrigger className="mt-1 h-8 text-xs bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["easy", "medium", "hard", "expert"].map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="text-muted-foreground uppercase tracking-wider">Role</span>
            <Select value={task.role_category} onValueChange={(v: RoleCategory) => updateTask.mutate({ id: task.id, role_category: v })}>
              <SelectTrigger className="mt-1 h-8 text-xs bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["general", "scripter", "designer", "promoter"].map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="text-muted-foreground uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3" /> Assigned</span>
            <p className="mt-1 text-foreground">{task.assignee?.username || "Unassigned"}</p>
          </div>
          <div>
            <span className="text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Created</span>
            <p className="mt-1 text-foreground">{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</p>
          </div>
          <div>
            <span className="text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" /> Deadline</span>
            {editing === "deadline" ? (
              <Input type="date" className="mt-1 h-8 text-xs bg-background border-border" defaultValue={task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd") : ""}
                onBlur={(e) => handleInlineEdit("deadline", e.target.value ? new Date(e.target.value).toISOString() : "")}
                autoFocus
              />
            ) : (
              <p className="mt-1 text-foreground cursor-pointer hover:text-primary" onClick={() => setEditing("deadline")}>
                {task.deadline ? format(new Date(task.deadline), "MMM d, yyyy") : "Set deadline..."}
              </p>
            )}
          </div>
          <div>
            <span className="text-muted-foreground uppercase tracking-wider">Created by</span>
            <p className="mt-1 text-foreground">{task.creator?.username || "Unknown"}</p>
          </div>
        </div>
      </div>

      {/* Why This Matters */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-mono font-semibold text-sm mb-2 text-primary">💡 Why This Matters</h2>
        {editing === "why" ? (
          <div className="space-y-2">
            <Textarea className="bg-background border-border text-sm resize-none" rows={3}
              defaultValue={task.why_it_matters || ""}
              onChange={(e) => setEditValues({ ...editValues, why: e.target.value })}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs font-mono" onClick={() => { handleInlineEdit("why_it_matters", editValues.why || ""); }}>
                <Save className="w-3 h-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => { setEditing("why"); setEditValues({ why: task.why_it_matters || "" }); }}>
            {task.why_it_matters || "Click to add context about why this task matters..."}
          </p>
        )}
      </div>

      {/* Common Mistakes */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-mono font-semibold text-sm mb-2 text-amber">⚠️ Common Mistakes</h2>
        {editing === "mistakes" ? (
          <div className="space-y-2">
            <Textarea className="bg-background border-border text-sm resize-none" rows={3}
              defaultValue={task.common_mistakes || ""}
              onChange={(e) => setEditValues({ ...editValues, mistakes: e.target.value })}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs font-mono" onClick={() => { handleInlineEdit("common_mistakes", editValues.mistakes || ""); }}>
                <Save className="w-3 h-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => { setEditing("mistakes"); setEditValues({ mistakes: task.common_mistakes || "" }); }}>
            {task.common_mistakes || "Click to add common mistakes to avoid..."}
          </p>
        )}
      </div>

      {/* Dependencies */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-mono font-semibold text-sm mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan" /> Dependencies
        </h2>
        {deps && deps.length > 0 ? (
          <div className="space-y-2 mb-3">
            {deps.map((d) => (
              <div key={d.id} className="flex items-center justify-between bg-background border border-border rounded px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${STATUS_CONFIG[(d.dependency?.status || "open") as TaskStatus].class}`}>
                    {STATUS_CONFIG[(d.dependency?.status || "open") as TaskStatus].label}
                  </span>
                  <span className="text-xs font-mono text-foreground cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/task/${d.depends_on}`)}>
                    {d.dependency?.title || "Unknown task"}
                  </span>
                </div>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeDep.mutate({ id: d.id, task_id: task.id })}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">No dependencies yet.</p>
        )}
        {availableDeps.length > 0 && (
          <Select onValueChange={(v) => addDep.mutate({ task_id: task.id, depends_on: v })}>
            <SelectTrigger className="h-8 text-xs bg-background border-border">
              <SelectValue placeholder="Add dependency..." />
            </SelectTrigger>
            <SelectContent>
              {availableDeps.map(t => <SelectItem key={t.id} value={t.id} className="text-xs font-mono">{t.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Developer Notes */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="font-mono font-semibold text-sm mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" /> Developer Notes
          <Badge variant="secondary" className="font-mono text-[10px]">{notes?.length ?? 0}</Badge>
        </h2>

        {/* Add note */}
        <div className="space-y-2 mb-4">
          <div className="flex gap-2">
            <Select value={noteType} onValueChange={setNoteType}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map(nt => <SelectItem key={nt.value} value={nt.value} className="text-xs font-mono">{nt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8 text-xs font-mono" onClick={handleAddNote} disabled={!noteContent.trim()}>
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
          <Textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Leave a note for the team..."
            className="bg-background border-border text-sm resize-none"
            rows={2}
          />
        </div>

        {/* Notes list */}
        <div className="space-y-2">
          {notes?.map((note) => {
            const noteTypeConfig = NOTE_TYPES.find(nt => nt.value === note.note_type);
            const NoteIcon = noteTypeConfig?.icon || MessageSquare;
            return (
              <div key={note.id} className={`border rounded-lg p-3 bg-background ${NOTE_COLORS[note.note_type] || "border-border"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                    <NoteIcon className="w-3 h-3" />
                    <span className="uppercase">{noteTypeConfig?.label}</span>
                    <span>·</span>
                    <span>{note.author?.username || "Unknown"}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-destructive/60 hover:text-destructive"
                    onClick={() => deleteNote.mutate({ id: note.id, task_id: task.id })}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
