import { useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { defaultProjects, PORTFOLIO_STORAGE_KEY, readProjects, type PortfolioProject } from "@/data/portfolio";

const blankProject = (): PortfolioProject => ({ id: crypto.randomUUID(), title: "", studio: "", tags: [], description: "", url: "", image: defaultProjects[0].image });

export function PortfolioManager() {
  const [projects, setProjects] = useState<PortfolioProject[]>(readProjects);
  const [draft, setDraft] = useState<PortfolioProject | null>(null);
  const [tags, setTags] = useState("");

  const persist = (next: PortfolioProject[]) => { setProjects(next); localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(next)); };
  const edit = (project: PortfolioProject) => { setDraft(project); setTags(project.tags.join(", ")); };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft?.title.trim() || !draft.url.trim()) return;
    const next = { ...draft, title: draft.title.trim(), tags: tags.split(",").map(tag => tag.trim()).filter(Boolean) };
    persist(projects.some(project => project.id === next.id) ? projects.map(project => project.id === next.id ? next : project) : [...projects, next]);
    setDraft(null);
  };

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="section-index">Workspace / Portfolio</p><h2 className="mt-2 text-3xl font-medium">Content manager</h2></div><div className="flex gap-2"><Button variant="outline" onClick={() => persist(defaultProjects)}><RotateCcw /> Reset</Button><Button onClick={() => { setDraft(blankProject()); setTags(""); }}><Plus /> Add project</Button></div></div>
      <div className="divide-y divide-border border-y border-border">
        {projects.map((project, index) => <div key={project.id} className="grid gap-4 py-5 md:grid-cols-[3rem_1fr_auto] md:items-center"><span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><div><p className="font-medium">{project.title}</p><p className="mt-1 text-xs text-muted-foreground">{project.studio} · {project.tags.join(" / ")}</p></div><div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => edit(project)} aria-label={`Edit ${project.title}`}><Pencil /></Button><Button variant="ghost" size="icon" onClick={() => persist(projects.filter(entry => entry.id !== project.id))} aria-label={`Delete ${project.title}`}><Trash2 /></Button></div></div>)}
      </div>

      <Dialog open={Boolean(draft)} onOpenChange={open => { if (!open) setDraft(null); }}>
        <DialogContent className="rounded-none border-border bg-card sm:max-w-xl"><DialogHeader><DialogTitle>{projects.some(project => project.id === draft?.id) ? "Edit project" : "Add project"}</DialogTitle></DialogHeader>
          {draft && <form onSubmit={save} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Input aria-label="Project title" placeholder="Title" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /><Input aria-label="Studio" placeholder="Studio" value={draft.studio} onChange={event => setDraft({ ...draft, studio: event.target.value })} /></div><Input aria-label="Tags" placeholder="Tags, separated by commas" value={tags} onChange={event => setTags(event.target.value)} /><Textarea aria-label="Description" placeholder="Muted description" value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} /><Input aria-label="Roblox link" type="url" placeholder="Roblox link" value={draft.url} onChange={event => setDraft({ ...draft, url: event.target.value })} /><Input aria-label="Artwork URL" type="url" placeholder="Artwork URL" value={draft.image} onChange={event => setDraft({ ...draft, image: event.target.value })} /><Button type="submit" className="w-full">Save project</Button></form>}
        </DialogContent>
      </Dialog>
    </section>
  );
}