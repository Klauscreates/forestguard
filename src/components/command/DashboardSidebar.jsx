import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, TreePine } from "lucide-react";
import { Link } from "react-router-dom";

const severities = [
  { label: "Critical", key: "criticalCount", color: "bg-destructive" },
  { label: "High", key: "highCount", color: "bg-orange-500" },
  { label: "Medium", key: "mediumCount", color: "bg-amber-500" },
  { label: "Low", key: "lowCount", color: "bg-blue-500" },
];

export default function DashboardSidebar({ summary, alerts = [], mode, isLoading, selectedAlert }) {
  const counts = summary || {
    alertCount: alerts.length,
    criticalCount: alerts.filter((alert) => alert.severity === "critical").length,
    highCount: alerts.filter((alert) => alert.severity === "high").length,
    mediumCount: alerts.filter((alert) => alert.severity === "medium").length,
    lowCount: alerts.filter((alert) => alert.severity === "low").length,
    peakRisk: alerts[0]?.risk || 0,
  };
  const leadAlert = alerts[0];
  const loading = mode === "loading";

  return (
    <aside className="hidden h-full w-[208px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#091424] text-white xl:flex">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
            <TreePine className="h-4 w-4 text-emerald-300" />
          </div>
          <div>
            <h1 className="font-display text-sm font-semibold leading-tight text-white">ForestGuard</h1>
            <p className="text-[10px] text-slate-400">Risk Ops</p>
          </div>
        </div>
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:bg-white/10 hover:text-white">
            <Home className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="space-y-4 border-b border-white/10 p-4">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">Region</p>
          <p className="text-sm font-semibold text-white">Sao Felix do Xingu</p>
          <p className="text-xs text-slate-400">Para, Brazil</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">Commodity</p>
          <Badge className="border-0 bg-white/10 text-xs text-white">Beef / Cattle</Badge>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Status</span>
            <Badge
              className={`border-0 text-[10px] ${
                loading ? "bg-cyan-400/10 text-cyan-200" : mode === "live" ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/10 text-amber-200"
              }`}
            >
              {loading ? "Loading" : mode === "live" ? "Live" : "Fallback"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Cases</span>
            <span className="text-sm font-bold text-red-300">{counts.alertCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Recent activity</span>
            <span className="text-xs font-semibold text-red-200">
              {loading
                ? "Refreshing"
                : leadAlert
                  ? `${leadAlert.trend === "increasing" ? "↑" : "→"} ${leadAlert.trend[0].toUpperCase()}${leadAlert.trend.slice(1)}`
                  : "Awaiting"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Top priority</span>
            <span className="text-xs font-semibold text-cyan-200">{counts.peakRisk || 0}/100</span>
          </div>
        </div>
        {isLoading && <p className="mt-3 text-[10px] text-slate-500">Loading live public alerts…</p>}
      </div>

      <div className="border-b border-white/10 p-4">
        <p className="mb-3 text-[10px] uppercase tracking-wider text-slate-400">Severity Mix</p>
        <div className="space-y-2">
          {severities.map((severity) => (
            <div key={severity.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <span className="flex items-center gap-2 text-xs text-slate-300">
                <span className={`h-2 w-2 rounded-full ${severity.color}`} />
                {severity.label}
              </span>
              <span className="text-xs font-semibold text-white">{counts[severity.key] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 p-4">
        <p className="mb-3 text-[10px] uppercase tracking-wider text-slate-400">Selected Case</p>
        {selectedAlert ? (
          <div className="space-y-2 rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-3">
            <p className="text-xs font-semibold text-white">{selectedAlert.title}</p>
            <p className="text-[11px] text-slate-400">{selectedAlert.zone}</p>
            <div className="flex flex-wrap gap-2">
              <Badge className="w-fit border-0 bg-white/10 text-[10px] text-white">{selectedAlert.risk}/100 risk</Badge>
              <Badge className="w-fit border-0 bg-white/10 text-[10px] text-white">{selectedAlert.hectares} ha land affected</Badge>
              {selectedAlert.discovery?.label ? (
                <Badge className="w-fit border-0 bg-emerald-400/10 text-[10px] text-emerald-100">{selectedAlert.discovery.label}</Badge>
              ) : null}
            </div>
            {selectedAlert.estimatedCarbonTonnes ? (
              <p className="text-[11px] text-emerald-100">
                {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(selectedAlert.estimatedCarbonTonnes)} tCO2e
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Select an alert to pin the active case here.</p>
        )}
      </div>
    </aside>
  );
}
