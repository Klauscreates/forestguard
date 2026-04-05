import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const severityOrder = ["critical", "high", "medium", "low"];

const severityMeta = {
  critical: { label: "Critical", dot: "bg-destructive" },
  high: { label: "High", dot: "bg-orange-500" },
  medium: { label: "Medium", dot: "bg-amber-500" },
  low: { label: "Low", dot: "bg-blue-500" },
};

function getModeTone(mode, isLoading) {
  if (isLoading || mode === "loading") return "bg-cyan-400/15 text-cyan-100";
  if (mode === "live") return "bg-emerald-400/15 text-emerald-100";
  return "bg-amber-400/15 text-amber-100";
}

export default function AlertFeedPanel({
  alerts = [],
  selectedAlertId,
  onSelectAlert,
  mode,
  isLoading,
}) {
  const [open, setOpen] = useState(true);

  const groupedAlerts = useMemo(
    () =>
      severityOrder.map((severity) => ({
        severity,
        items: alerts.filter((alert) => alert.severity === severity),
      })),
    [alerts]
  );

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#091424] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-200" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Alert Feed</p>
            <p className="text-[11px] text-slate-400">Grouped live cases by severity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("border-0 text-[10px]", getModeTone(mode, isLoading))}>
            {isLoading || mode === "loading" ? "LOADING" : mode === "live" ? "LIVE" : "FALLBACK"}
          </Badge>
          <Badge className="border-0 bg-white/10 text-[10px] text-white">{alerts.length} alerts</Badge>
          <button
            type="button"
            className="rounded-full border border-white/10 p-1.5 text-slate-300 transition hover:bg-white/5 hover:text-white"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Collapse alert feed" : "Expand alert feed"}
          >
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-3">
        {groupedAlerts.map(({ severity, items }) => (
          <div
            key={severity}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-300"
          >
            <span className={cn("h-2 w-2 rounded-full", severityMeta[severity].dot)} />
            <span>{severityMeta[severity].label}</span>
            <span className="font-semibold text-white">{items.length}</span>
          </div>
        ))}
      </div>

      {open && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-6 text-xs text-slate-400">Loading live public alert groups for the monitored zone...</div>
          ) : !alerts.length ? (
            <div className="px-4 py-6 text-xs text-slate-400">No qualifying alerts are available in the current dataset.</div>
          ) : (
            groupedAlerts.map(({ severity, items }) => (
              <section key={severity} className="border-b border-white/10 last:border-b-0">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", severityMeta[severity].dot)} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                      {severityMeta[severity].label}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400">{items.length}</span>
                </div>

                {items.length ? (
                  <div className="space-y-1 px-2 pb-3">
                    {items.map((alert) => {
                      const selected = alert.id === selectedAlertId;
                      return (
                        <button
                          key={alert.id}
                          type="button"
                          onClick={() => onSelectAlert(alert.id)}
                          className={cn(
                            "w-full rounded-2xl border px-3 py-3 text-left transition",
                            selected
                              ? "border-cyan-300/40 bg-cyan-300/8"
                              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-snug text-white">{alert.title}</p>
                              <p className="mt-1 text-[11px] text-slate-400">{alert.zone}</p>
                            </div>
                            <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-300">
                              {alert.risk}/100
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {alert.timeLabel}
                            </span>
                            <span>{alert.hectares} ha</span>
                            <span>{alert.source}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 pb-3 text-[11px] text-slate-500">No alerts in this severity group.</div>
                )}
              </section>
            ))
          )}
        </div>
      )}
    </Card>
  );
}
