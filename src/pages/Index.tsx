import { useAuth } from "@/hooks/useAuth";
import { LoginScreen } from "@/components/LoginScreen";
import { AppSidebar } from "@/components/AppSidebar";
import { TaskBoard } from "@/components/TaskBoard";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Routes, Route } from "react-router-dom";
import TaskDetailPage from "@/pages/TaskDetail";
import WikiIndex from "@/pages/WikiIndex";
import WikiPageView from "@/pages/WikiPage";
import ChangeLogPage from "@/pages/ChangeLog";
import RoleDashboard from "@/pages/RoleDashboard";

const Index = () => {
  const { member, login, logout } = useAuth();

  if (!member) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar currentUser={member} onLogout={logout} />
        <main className="flex-1 min-w-0">
          <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 h-12 flex items-center px-4">
            <SidebarTrigger className="mr-3" />
            <span className="font-mono text-xs text-muted-foreground">Deadly's Studio Tasks</span>
          </header>
          <Routes>
            <Route path="/" element={<TaskBoard currentUser={member} onLogout={logout} />} />
            <Route path="/task/:id" element={<TaskDetailPage currentUser={member} />} />
            <Route path="/wiki" element={<WikiIndex currentUser={member} />} />
            <Route path="/wiki/:slug" element={<WikiPageView currentUser={member} />} />
            <Route path="/changelog" element={<ChangeLogPage />} />
            <Route path="/role/:role" element={<RoleDashboard currentUser={member} />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
