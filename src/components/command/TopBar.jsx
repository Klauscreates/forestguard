import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, Bot } from "lucide-react";

function formatTimestamp(value) {
  if (!value) return "Awaiting alert refresh";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TopBar({
  onGenerateReport,
  mode,
  generatedAt,
  sources = [],
  canGenerateReport,
  agentConsoleOpen,
  onToggleAgentConsole,
}) {
  const live = mode === "live";
  const loading = mode === "loading";

  return (
    <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#08111f]/90 px-5 text-white backdrop-blur">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold text-white">Risk Command Center</h2>
          <p className="text-[11px] text-slate-400">Procurement and compliance workflow centered on live case review.</p>
        </div>
        <Badge
          className={`gap-1.5 border-0 text-xs text-white ${
            loading ? "bg-cyan-400/15" : live ? "bg-emerald-400/15" : "bg-amber-400/15"
          }`}
        >
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              loading ? "bg-cyan-300 animate-pulse" : live ? "bg-emerald-300 animate-pulse" : "bg-amber-300"
            }`}
          />
          {loading ? "LOADING LIVE DATA" : live ? "LIVE PUBLIC DATA" : "FALLBACK DEMO DATA"}
        </Badge>
        <Badge variant="outline" className="gap-1 border-white/15 bg-white/5 text-xs text-slate-200">
          <Calendar className="h-3 w-3" /> {formatTimestamp(generatedAt)}
        </Badge>
        {!loading && sources[0] && (
          <span className="hidden text-[11px] text-slate-400 xl:block">{sources[0]}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 border-white/15 bg-white/5 text-xs text-white hover:bg-white/10"
          onClick={onToggleAgentConsole}
        >
          <Bot className="h-3.5 w-3.5" /> {agentConsoleOpen ? "Hide Agent Console" : "Show Agent Console"}
        </Button>
        <Button
          size="sm"
          disabled={!canGenerateReport}
          className="gap-1.5 bg-white text-xs text-slate-950 hover:bg-slate-100 disabled:bg-white/10 disabled:text-slate-500"
          onClick={onGenerateReport}
        >
          <Sparkles className="h-3.5 w-3.5" /> Generate Report
        </Button>
      </div>
    </div>
  );
}
