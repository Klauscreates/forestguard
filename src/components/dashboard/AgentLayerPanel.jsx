import { useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatTime(value) {
  if (!value) return "now";

  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getStatusMeta(status, mode) {
  if (status === "running") return { label: "Executing", tone: "bg-cyan-400/15 text-cyan-100", dot: "bg-cyan-300" };
  if (status === "error") return { label: "Error", tone: "bg-red-400/15 text-red-100", dot: "bg-red-300" };
  if (status === "unavailable") return { label: "Unavailable", tone: "bg-amber-400/15 text-amber-100", dot: "bg-amber-300" };
  if (mode === "live") return { label: "Monitoring live data", tone: "bg-emerald-400/15 text-emerald-100", dot: "bg-emerald-300" };
  if (mode === "loading") return { label: "Refreshing", tone: "bg-cyan-400/15 text-cyan-100", dot: "bg-cyan-300" };
  return { label: "Fallback monitoring", tone: "bg-amber-400/15 text-amber-100", dot: "bg-amber-300" };
}

function getUploadMeta(status) {
  if (status === "complete") return { icon: CheckCircle2, tone: "bg-emerald-400/15 text-emerald-100" };
  if (status === "failed") return { icon: XCircle, tone: "bg-red-400/15 text-red-100" };
  if (status === "analyzing") return { icon: Loader2, tone: "bg-cyan-400/15 text-cyan-100" };
  return { icon: RefreshCw, tone: "bg-white/10 text-slate-200" };
}

function getLogMeta(status) {
  if (status === "failed") return { dot: "bg-red-300", icon: XCircle };
  if (status === "running") return { dot: "bg-cyan-300", icon: Loader2 };
  return { dot: "bg-emerald-300", icon: CheckCircle2 };
}

export default function AgentLayerPanel({
  mode,
  status,
  currentTask,
  logs = [],
  uploads = [],
  onFilesSelected,
  canUpload,
}) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const statusMeta = getStatusMeta(status, mode);

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-cyan-300/15 bg-[#07101d] text-white shadow-[0_0_0_1px_rgba(34,211,238,0.04)]">
      <div className="flex items-center justify-between border-b border-cyan-300/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-200" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Agent Layer</p>
            <p className="truncate text-[11px] text-slate-400">{currentTask}</p>
          </div>
        </div>
        <Badge className={cn("gap-1.5 border-0 text-[10px]", statusMeta.tone)}>
          <span className={cn("h-2 w-2 rounded-full", statusMeta.dot)} />
          {statusMeta.label}
        </Badge>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <div
            className={cn(
              "rounded-[22px] border border-dashed px-4 py-5 transition",
              dragActive ? "border-cyan-300/60 bg-cyan-300/8" : "border-white/10 bg-white/[0.03]",
              !canUpload && "opacity-60"
            )}
            onDragOver={(event) => {
              event.preventDefault();
              if (canUpload) setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              if (!canUpload) return;
              onFilesSelected(Array.from(event.dataTransfer.files || []));
            }}
          >
            <div className="flex items-center gap-2">
              <FileUp className="h-4 w-4 text-cyan-200" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">File and log analysis</p>
            </div>
            <p className="mt-3 text-sm font-medium text-white">Drop logs or evidence files for live analysis</p>
            <p className="mt-2 text-xs leading-6 text-slate-400">
              Supported text-based files: TXT, LOG, JSON, CSV, MD, YAML, TSV. Files are passed into the live agent path and attached to the selected case.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                onFilesSelected(Array.from(event.target.files || []));
                event.target.value = "";
              }}
            />
            <div className="mt-4 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={!canUpload}
                className="gap-1.5 bg-white text-xs text-slate-950 hover:bg-slate-100"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-3.5 w-3.5" />
                Choose files
              </Button>
              {!canUpload && <span className="text-[11px] text-slate-500">Select an alert first.</span>}
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-200" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Uploads</p>
            </div>

            {uploads.length ? (
              <div className="mt-4 space-y-2">
                {uploads.map((upload) => {
                  const meta = getUploadMeta(upload.status);
                  const Icon = meta.icon;
                  return (
                    <div key={upload.id} className="rounded-2xl border border-white/10 bg-[#08111f] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-white">{upload.fileName}</p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {upload.analysis?.summary || upload.message || "Waiting for analysis output."}
                          </p>
                        </div>
                        <Badge className={cn("gap-1.5 border-0 text-[10px]", meta.tone)}>
                          <Icon className={cn("h-3 w-3", upload.status === "analyzing" && "animate-spin")} />
                          {upload.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-400">No real uploads have been analyzed yet.</p>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded-[22px] border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Execution log</p>
            <p className="mt-1 text-[11px] text-slate-400">Real fetch, reasoning, and tool steps only.</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {logs.length ? (
              <div className="space-y-3">
                {logs.map((entry) => {
                  const meta = getLogMeta(entry.status);
                  const Icon = meta.icon;
                  return (
                    <div key={entry.id} className="rounded-2xl border border-white/10 bg-[#08111f] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                            <p className="text-xs font-semibold text-white">{entry.label}</p>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-300">{entry.detail}</p>
                          <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">{entry.tool}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-[10px] text-slate-500">
                          <Icon className={cn("h-3.5 w-3.5", entry.status === "running" && "animate-spin")} />
                          <span>{formatTime(entry.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-xs text-slate-400">
                No real agent executions have completed yet. The log will populate from alert refreshes, Gemini runs, and file analysis tasks.
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
