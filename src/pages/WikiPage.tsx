import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWikiPage, useUpdateWikiPage, WIKI_CATEGORIES } from "@/hooks/useWiki";
import { type TeamMember } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Edit2, Save, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  currentUser: TeamMember;
}

export default function WikiPageView({ currentUser }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: page, isLoading } = useWikiPage(slug);
  const updatePage = useUpdateWikiPage();

  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");

  const startEdit = () => {
    if (!page) return;
    setContent(page.content);
    setTitle(page.title);
    setCategory(page.category);
    setEditMode(true);
  };

  const handleSave = () => {
    if (!page) return;
    updatePage.mutate(
      { id: page.id, content, title, category, updated_by: currentUser.id },
      { onSuccess: () => setEditMode(false) }
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!page) {
    return (
      <div className="text-center py-20">
        <p className="font-mono text-muted-foreground">Page not found</p>
        <Button variant="ghost" onClick={() => navigate("/wiki")} className="mt-4 font-mono"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate("/wiki")} className="font-mono text-xs h-7 px-2 -ml-2 mb-4">
        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Wiki
      </Button>

      <div className="bg-card border border-border rounded-lg p-6">
        {editMode ? (
          <div className="space-y-4">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="font-mono font-bold text-lg bg-background border-border" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[200px] bg-background border-border text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WIKI_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)}
              className="bg-background border-border text-sm font-mono min-h-[400px] resize-none" placeholder="Write your content here... (Markdown-style plain text)" />
            <div className="flex gap-2">
              <Button onClick={handleSave} className="font-mono text-xs"><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
              <Button variant="ghost" onClick={() => setEditMode(false)} className="text-xs">Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-mono font-bold text-xl text-foreground mb-1">{page.title}</h1>
                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                    {WIKI_CATEGORIES.find(c => c.value === page.category)?.label}
                  </span>
                  <span>Updated {formatDistanceToNow(new Date(page.updated_at), { addSuffix: true })}</span>
                  {page.updater && <span>by {page.updater.username}</span>}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={startEdit} className="font-mono text-xs border-primary/30 text-primary hover:bg-primary/10">
                <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
            </div>
            <div className="prose prose-invert max-w-none">
              {page.content ? (
                <pre className="text-sm font-mono text-foreground whitespace-pre-wrap leading-relaxed">{page.content}</pre>
              ) : (
                <p className="text-sm text-muted-foreground italic">No content yet. Click Edit to add content.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
