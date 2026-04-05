import { useMemo, useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Mic,
  MicOff,
  Radio,
  Send,
  TerminalSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const severityOrder = ["critical", "high", "medium", "low"];

const severityMeta = {
  critical: { label: "Critical", dot: "bg-destructive" },
  high: { label: "High", dot: "bg-orange-500" },
  medium: { label: "Medium", dot: "bg-amber-500" },
  low: { label: "Low", dot: "bg-blue-500" },
};

function formatTime(value) {
  if (!value) return "now";

  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatCarbon(value) {
  if (!value) return "N/A";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} tCO2e`;
}

function getStatusMeta(status, mode) {
  if (status === "running") return { label: "Executing", tone: "bg-cyan-400/15 text-cyan-100", dot: "bg-cyan-300" };
  if (status === "error") return { label: "Error", tone: "bg-red-400/15 text-red-100", dot: "bg-red-300" };
  if (status === "unavailable") return { label: "Unavailable", tone: "bg-amber-400/15 text-amber-100", dot: "bg-amber-300" };
  if (mode === "live") return { label: "Monitoring live data", tone: "bg-emerald-400/15 text-emerald-100", dot: "bg-emerald-300" };
  if (mode === "loading") return { label: "Refreshing", tone: "bg-cyan-400/15 text-cyan-100", dot: "bg-cyan-300" };
  return { label: "Fallback monitoring", tone: "bg-amber-400/15 text-amber-100", dot: "bg-amber-300" };
}

function getVoiceMeta(status) {
  if (status === "connecting") return { label: "Voice connecting", tone: "bg-cyan-400/15 text-cyan-100" };
  if (status === "processing") return { label: "Voice processing", tone: "bg-cyan-400/15 text-cyan-100" };
  if (status === "rate-limited") return { label: "Voice cooldown", tone: "bg-amber-400/15 text-amber-100" };
  if (status === "wake-detected") return { label: "Wake word detected", tone: "bg-emerald-400/15 text-emerald-100" };
  if (status === "listening") return { label: "Voice listening", tone: "bg-emerald-400/15 text-emerald-100" };
  if (status === "unavailable") return { label: "Gemini live unavailable", tone: "bg-amber-400/15 text-amber-100" };
  if (status === "paused") return { label: "Voice paused", tone: "bg-white/10 text-slate-300" };
  if (status === "blocked") return { label: "Mic blocked", tone: "bg-red-400/15 text-red-100" };
  if (status === "unsupported") return { label: "Voice unsupported", tone: "bg-amber-400/15 text-amber-100" };
  return { label: "Voice idle", tone: "bg-white/10 text-slate-300" };
}

function getFeedEntries({ logs, caseInsight, chatMessages }) {
  const entries = [];
  const orderedLogs = [...logs].reverse();

  orderedLogs.forEach((entry) => {
    const shouldShowLog = entry.status === "failed" || entry.tool === "config.gemini" || entry.tool === "agent.error";
    if (!shouldShowLog) return;

    entries.push({
      id: entry.id,
      timestamp: entry.timestamp,
      kind: "log",
      label: entry.label,
      detail: entry.detail,
      tool: entry.tool,
      status: entry.status,
    });
  });

  chatMessages.forEach((message) => {
    if (message.role === "user") {
      entries.push({
        id: message.id,
        timestamp: message.timestamp,
        kind: "command",
        label: "Command",
        detail: message.text,
      });
      return;
    }

    const response = message.response;
    entries.push({
      id: message.id,
      timestamp: message.timestamp,
      kind: "response",
      label: response?.title || "Agent response",
      detail: response?.summary || response?.message || "No response body returned.",
      mode: response?.mode,
      actions: response?.recommendedActions || [],
    });
  });

  if (caseInsight?.execution?.completedAt) {
    entries.push({
      id: `case-insight-${caseInsight.execution.completedAt}`,
      timestamp: caseInsight.execution.completedAt,
      kind: "result",
      label: caseInsight.title || "Case reasoning",
      detail: caseInsight.summary || caseInsight.message || "No case reasoning summary returned.",
      mode: caseInsight.mode,
      actions: caseInsight.recommendedActions || [],
    });
  }

  return entries.sort((left, right) => new Date(left.timestamp || 0).getTime() - new Date(right.timestamp || 0).getTime());
}

export default function AgentConsoleSidecar({
  alerts = [],
  selectedAlert,
  onSelectAlert,
  onGenerateReport,
  mode,
  agentStatus,
  currentTask,
  voiceEnabled,
  voiceSupported,
  voiceStatus,
  voiceTranscript,
  voiceDebug,
  onToggleVoice,
  logs = [],
  chatMessages = [],
  caseInsight,
  inputValue,
  onInputChange,
  onSubmit,
  isPending,
}) {
  const [feedOpen, setFeedOpen] = useState(true);
  const [reasoningOpen, setReasoningOpen] = useState(true);
  const statusMeta = getStatusMeta(agentStatus, mode);
  const voiceMeta = getVoiceMeta(voiceStatus);
  const cooldownSeconds = voiceDebug?.cooldownUntil ? Math.max(0, Math.ceil((voiceDebug.cooldownUntil - Date.now()) / 1000)) : 0;
  const groupedAlerts = useMemo(
    () =>
      severityOrder.map((severity) => ({
        severity,
        items: alerts.filter((alert) => alert.severity === severity),
      })),
    [alerts]
  );
  const consoleEntries = useMemo(
    () => getFeedEntries({ logs, caseInsight, chatMessages }),
    [logs, caseInsight, chatMessages]
  );
  const latestResponseEntry = [...consoleEntries].reverse().find((entry) => entry.kind === "response" || entry.kind === "result");

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Card className="overflow-hidden rounded-[24px] border border-white/10 bg-[#07101d] text-white shadow-none">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          onClick={() => setFeedOpen((current) => !current)}
        >
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-cyan-200" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Alert Feed</p>
              <p className="text-[11px] text-slate-400">Compact live cases grouped by severity.</p>
            </div>
          </div>
          {feedOpen ? <ChevronUp className="h-4 w-4 text-slate-300" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
        </button>

        {feedOpen ? (
          <div className="max-h-[250px] overflow-y-auto border-t border-white/10 px-4 py-3">
            <div className="space-y-3">
              {groupedAlerts.map(({ severity, items }) => (
                <div key={severity}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", severityMeta[severity].dot)} />
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{severityMeta[severity].label}</p>
                    </div>
                    <span className="text-[10px] text-slate-500">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((alert) => (
                      <button
                        key={alert.id}
                        type="button"
                        onClick={() => onSelectAlert(alert.id)}
                        className={cn(
                          "w-full rounded-[18px] border px-3 py-2.5 text-left transition",
                          selectedAlert?.id === alert.id
                            ? "border-cyan-300/40 bg-cyan-300/8"
                            : "border-white/10 bg-[#08111f] hover:bg-white/[0.06]"
                        )}
                      >
                        <p className="line-clamp-2 text-xs font-semibold text-white">{alert.title}</p>
                        <p className="mt-1 text-[10px] text-slate-400">{alert.hectares} ha · {alert.timeLabel}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-cyan-300/15 bg-[#07101d] text-white shadow-none">
        <div className="flex items-center justify-between border-b border-cyan-300/10 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Gemini Command Center</p>
            <p className="truncate text-[11px] text-slate-400">{currentTask}</p>
          </div>
          <Badge className={cn("gap-1.5 border-0 text-[10px]", statusMeta.tone)}>
            <span className={cn("h-2 w-2 rounded-full", statusMeta.dot)} />
            {statusMeta.label}
          </Badge>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-3">
            <div className="rounded-[20px] border border-cyan-300/15 bg-cyan-300/6 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200">Active Case</p>
                  {selectedAlert ? (
                    <>
                      <p className="mt-2 text-sm font-semibold text-white">{selectedAlert.title}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{selectedAlert.zone}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className="border-0 bg-white/10 text-[10px] text-white">{selectedAlert.risk}/100 risk</Badge>
                        {selectedAlert.discovery?.label ? (
                          <Badge className="border-0 bg-emerald-400/10 text-[10px] text-emerald-100">{selectedAlert.discovery.label}</Badge>
                        ) : null}
                        <Badge className="border-0 bg-white/10 text-[10px] text-white">
                          {selectedAlert.estimatedCarbonTonnes ? formatCarbon(selectedAlert.estimatedCarbonTonnes) : "No carbon estimate"}
                        </Badge>
                      </div>
                      {selectedAlert.weakSignals?.[0] ? (
                        <p className="mt-3 text-[11px] leading-5 text-slate-300">
                          Weak signal: {selectedAlert.weakSignals[0].title}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">Select an alert to bind the console to a live case.</p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedAlert}
                  className="gap-1.5 bg-white text-xs text-slate-950 hover:bg-slate-100"
                  onClick={onGenerateReport}
                >
                  Report <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Voice</p>
                  <p className="mt-1 text-[11px] text-slate-400">Always-on voice session for the active tab.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={!voiceSupported || cooldownSeconds > 0}
                  className="gap-1.5 bg-white text-xs text-slate-950 hover:bg-slate-100 disabled:bg-white/10 disabled:text-slate-500"
                  onClick={onToggleVoice}
                >
                  {voiceEnabled ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  {cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : voiceEnabled ? "Mute Voice" : "Enable Voice"}
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className={cn("border-0 text-[10px]", voiceMeta.tone)}>
                  <Radio className="mr-1 h-3 w-3" />
                  {voiceMeta.label}
                </Badge>
                {voiceTranscript ? <Badge className="max-w-full border-0 bg-white/10 text-[10px] text-slate-200">Heard: {voiceTranscript}</Badge> : null}
              </div>
            </div>

            {latestResponseEntry ? (
              <div className="rounded-[20px] border border-white/10 bg-[#08111f] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Latest Output</p>
                <p className="mt-2 text-sm font-semibold text-white">{latestResponseEntry.label}</p>
                <p className="mt-2 text-[12px] leading-6 text-slate-300">{latestResponseEntry.detail}</p>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {[
                  "What should procurement do about this case?",
                  "Summarize the business risk.",
                  "Generate a procurement response.",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => onInputChange(prompt)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <Textarea
                value={inputValue}
                onChange={(event) => onInputChange(event.target.value)}
                disabled={!selectedAlert}
                rows={4}
                placeholder={selectedAlert ? "Ask Forest what to do about this case." : "Select an alert to activate the command center."}
                className="resize-none border-white/10 bg-[#08111f] text-white placeholder:text-slate-500 focus-visible:ring-cyan-300/40"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (!isPending && selectedAlert) {
                      onSubmit(event);
                    }
                  }
                }}
              />

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-400">
                  {selectedAlert ? "Forest uses the selected live case and dashboard state." : "Select a live case to enable the command prompt."}
                </p>
                <Button
                  type="submit"
                  disabled={!selectedAlert || isPending}
                  className="gap-1.5 bg-white text-xs text-slate-950 hover:bg-slate-100"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Run Audit
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Card>

      <Card className="min-h-0 overflow-hidden rounded-[24px] border border-white/10 bg-[#07101d] text-white shadow-none">
        <button
          type="button"
          className="flex w-full items-center justify-between border-b border-white/10 px-4 py-3 text-left"
          onClick={() => setReasoningOpen((current) => !current)}
        >
          <div className="flex items-center gap-2">
            <TerminalSquare className="h-4 w-4 text-cyan-200" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">System Status</p>
              <p className="text-[11px] text-slate-400">Voice/session state and final agent output.</p>
            </div>
          </div>
          {reasoningOpen ? <ChevronUp className="h-4 w-4 text-slate-300" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
        </button>

        {reasoningOpen ? (
          <div className="max-h-[240px] overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              {voiceDebug ? (
                <div className="rounded-[18px] border border-white/10 bg-[#08111f] p-3 text-[10px] text-slate-300">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-500">Token</span><p>{voiceDebug.tokenStatus || "idle"}</p></div>
                    <div><span className="text-slate-500">Socket</span><p>{voiceDebug.socketState || "idle"}</p></div>
                    <div><span className="text-slate-500">Model</span><p className="break-all">{voiceDebug.model || "unknown"}</p></div>
                    <div><span className="text-slate-500">Error</span><p className="break-words">{voiceDebug.lastError || "none"}</p></div>
                  </div>
                </div>
              ) : null}

              {consoleEntries.length ? (
                consoleEntries.slice(-4).reverse().map((entry) => (
                  <div key={entry.id} className="rounded-[18px] border border-white/10 bg-[#08111f] px-3 py-3 font-mono text-[11px] leading-5 text-slate-300">
                    <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      <span>{formatTime(entry.timestamp)}</span>
                      <span>{entry.kind === "log" ? entry.tool : entry.kind}</span>
                    </div>
                    <p className="mt-2 text-cyan-200">{">"} {entry.label}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-slate-300">{entry.detail}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[18px] border border-white/10 bg-[#08111f] p-3 text-xs text-slate-500">
                  No agent output yet. Select a case and run a command.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
