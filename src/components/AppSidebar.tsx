import { useNavigate, useLocation } from "react-router-dom";
import { type TeamMember } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Skull, LayoutDashboard, BookOpen, History, LogOut, Code, Palette, Megaphone } from "lucide-react";

const mainNav = [
  { title: "All Tasks", url: "/", icon: LayoutDashboard },
  { title: "Knowledge Base", url: "/wiki", icon: BookOpen },
  { title: "Change Log", url: "/changelog", icon: History },
];

const roleNav = [
  { title: "Scripter View", url: "/role/scripter", icon: Code },
  { title: "Designer View", url: "/role/designer", icon: Palette },
  { title: "Promoter View", url: "/role/promoter", icon: Megaphone },
];

interface Props {
  currentUser: TeamMember;
  onLogout: () => void;
}

export function AppSidebar({ currentUser, onLogout }: Props) {
  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center neon-glow">
            <Skull className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-mono font-bold text-xs text-foreground">Deadly's Studio</p>
            <p className="font-mono text-[10px] text-muted-foreground">TASKS</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-widest">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} className="font-mono text-xs" activeClassName="bg-primary/10 text-primary">
                      <item.icon className="w-4 h-4 mr-2" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-widest">Role Dashboards</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {roleNav.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="font-mono text-xs" activeClassName="bg-primary/10 text-primary">
                      <item.icon className="w-4 h-4 mr-2" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground truncate">{currentUser.username}</span>
          <Button variant="ghost" size="sm" onClick={onLogout} className="h-7 w-7 p-0">
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
