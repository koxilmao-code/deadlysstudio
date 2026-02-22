import { useState } from "react";
import { useCreateTask, type TaskPriority } from "@/hooks/useTasks";
import { type TeamMember } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface Props {
  currentUser: TeamMember;
}

export function CreateTaskDialog({ currentUser }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const createTask = useCreateTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask.mutate(
      { title: title.trim(), description: description.trim() || undefined, priority, created_by: currentUser.id },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setPriority("medium");
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-mono font-semibold gap-2">
          <Plus className="w-4 h-4" /> New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border font-mono">
        <DialogHeader>
          <DialogTitle className="font-mono">Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="mt-1 bg-background border-border"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              className="mt-1 bg-background border-border resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Priority</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger className="mt-1 bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={!title.trim() || createTask.isPending} className="w-full font-semibold">
            Create Task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
