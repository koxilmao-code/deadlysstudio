import { useState, useEffect } from "react";
import { getStoredMember, clearMember, type TeamMember } from "@/lib/auth";

export function useAuth() {
  const [member, setMember] = useState<TeamMember | null>(getStoredMember);

  useEffect(() => {
    const handleStorage = () => setMember(getStoredMember());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const logout = () => {
    clearMember();
    setMember(null);
  };

  const login = (m: TeamMember) => {
    setMember(m);
  };

  return { member, login, logout };
}
