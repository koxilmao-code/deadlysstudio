import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, KanbanSquare, LogOut } from "lucide-react";
import { LoginScreen } from "@/components/LoginScreen";
import { AdminKanban } from "@/components/AdminKanban";
import { PortfolioManager } from "@/components/PortfolioManager";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import TaskDetailPage from "@/pages/TaskDetail";

export default function AdminPage() {
  const { member, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (!member) return <LoginScreen onLogin={login} />;

  const portfolioActive = location.pathname.includes("/portfolio");
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background"><div className="flex min-h-16 items-center justify-between px-4 md:px-8"><div className="flex items-center gap-6"><Link to="/" className="text-sm font-semibold uppercase">Deadly’s Studio</Link><span className="hidden border-l border-border pl-6 text-xs text-muted-foreground sm:block">Internal workspace</span></div><div className="flex items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:block">{member.username}</span><Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out"><LogOut /></Button></div></div></header>
      <div className="grid lg:grid-cols-[15rem_1fr]">
        <aside className="border-b border-border p-4 lg:min-h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r"><nav className="flex gap-2 lg:flex-col"><Button asChild variant={!portfolioActive ? "secondary" : "ghost"} className="justify-start"><Link to="/admin"><KanbanSquare /> Tasks</Link></Button><Button asChild variant={portfolioActive ? "secondary" : "ghost"} className="justify-start"><Link to="/admin/portfolio"><BriefcaseBusiness /> Portfolio</Link></Button></nav><Button variant="ghost" className="mt-8 hidden justify-start text-muted-foreground lg:flex" onClick={() => navigate("/")}><ArrowLeft /> Public site</Button></aside>
        <main className="min-w-0 p-4 md:p-8 xl:p-10"><Routes><Route path="/" element={<AdminKanban currentUser={member} />} /><Route path="/portfolio" element={<PortfolioManager />} /><Route path="/task/:id" element={<TaskDetailPage currentUser={member} />} /></Routes></main>
      </div>
    </div>
  );
}