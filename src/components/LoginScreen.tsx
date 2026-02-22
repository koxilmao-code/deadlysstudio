import { useState } from "react";
import { joinTeam, type TeamMember } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skull, Loader2 } from "lucide-react";

interface LoginScreenProps {
  onLogin: (member: TeamMember) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError("");
    try {
      const member = await joinTeam(username.trim(), password);
      onLogin(member);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center grid-pattern">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-card border border-border neon-glow mb-4">
            <Skull className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-mono font-bold text-foreground">
            Deadly's Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">TASK MANAGEMENT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-lg p-6">
          <div>
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="mt-1 bg-background border-border font-mono"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Team Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter team password"
              className="mt-1 bg-background border-border font-mono"
            />
          </div>
          {error && (
            <p className="text-destructive text-sm font-mono">{error}</p>
          )}
          <Button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full font-mono font-semibold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Enter Studio
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
          Ask your team lead for the password
        </p>
      </div>
    </div>
  );
}
