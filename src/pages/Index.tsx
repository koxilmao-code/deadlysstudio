import { useAuth } from "@/hooks/useAuth";
import { LoginScreen } from "@/components/LoginScreen";
import { TaskBoard } from "@/components/TaskBoard";

const Index = () => {
  const { member, login, logout } = useAuth();

  if (!member) {
    return <LoginScreen onLogin={login} />;
  }

  return <TaskBoard currentUser={member} onLogout={logout} />;
};

export default Index;
