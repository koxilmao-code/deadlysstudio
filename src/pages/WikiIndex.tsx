import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWikiPages, useCreateWikiPage, useDeleteWikiPage, WIKI_CATEGORIES } from "@/hooks/useWiki";
import { type TeamMember } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, BookOpen, Trash2, Loader2, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  currentUser: TeamMember;
}

export default function WikiIndex({ currentUser }: Props) {
  const { data: pages, isLoading } = useWikiPages();
  const createPage = useCreateWikiPage();
  const deletePage = useDeleteWikiPage();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const filtered = pages?.filter(p => {
    if (filterCat !== "all" && p.category !== filterCat) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }) ?? [];

  const handleCreate = () => {
    if (!title.trim()) return;
    const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    createPage.mutate(
      { title: title.trim(), slug, content: "", category, created_by: currentUser.id },
      { onSuccess: () => { setOpen(false); setTitle(""); navigate(`/wiki/${slug}`); } }
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="font-mono font-bold text-lg">Knowledge Base</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono font-semibold gap-2 text-xs">
              <Plus className="w-4 h-4" /> New Page
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border font-mono">
            <DialogHeader><DialogTitle className="font-mono">Create Wiki Page</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" className="mt-1 bg-background border-border" autoFocus />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1 bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WIKI_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={!title.trim()} className="w-full font-semibold">Create Page</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pages..." className="pl-9 h-8 text-xs bg-background border-border font-mono" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-background border-border font-mono"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {WIKI_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-mono text-muted-foreground text-sm">No wiki pages yet. Create one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(page => (
            <div key={page.id} className="bg-card border border-border rounded-lg p-4 card-hover cursor-pointer flex items-center justify-between"
              onClick={() => navigate(`/wiki/${page.slug}`)}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-mono font-semibold text-sm text-foreground">{page.title}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                    {WIKI_CATEGORIES.find(c => c.value === page.category)?.label}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(page.updated_at), { addSuffix: true })}
                  {page.updater && ` by ${page.updater.username}`}
                </p>
              </div>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); deletePage.mutate(page.id); }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
