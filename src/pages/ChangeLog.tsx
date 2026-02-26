import { useChangeLogs } from "@/hooks/useChangeLogs";
import { Loader2, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ChangeLogPage() {
  const { data: logs, isLoading } = useChangeLogs();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-primary" />
        <h1 className="font-mono font-bold text-lg">Change Log</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !logs || logs.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-mono text-muted-foreground text-sm">No changes recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground uppercase">{log.action}</span>
                  <span className="text-muted-foreground">{log.entity_type}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  {log.changer && ` · ${log.changer.username}`}
                </span>
              </div>
              {log.reason && <p className="text-xs text-foreground mt-1">{log.reason}</p>}
              {log.changes && (
                <pre className="text-[10px] font-mono text-muted-foreground mt-2 bg-background rounded p-2 overflow-x-auto">
                  {JSON.stringify(log.changes, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
