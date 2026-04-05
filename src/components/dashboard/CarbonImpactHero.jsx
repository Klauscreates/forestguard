import { AlertTriangle, Leaf, ShieldCheck, Trees } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function formatTonnes(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
}

function MiniCard({ icon: Icon, label, value, suffix, detail, tone = "default" }) {
  const tones = {
    default: "border-white/10 bg-white/[0.04]",
    success: "border-emerald-300/20 bg-emerald-300/10",
    warning: "border-amber-300/20 bg-amber-300/10",
  };

  return (
    <Card className={`rounded-[24px] border p-4 text-white shadow-none ${tones[tone]}`}>
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-[#08111f]">
          <Icon className="h-4 w-4 text-cyan-200" />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">{label}</p>
      </div>
      <div className="mt-5 flex items-end gap-2">
        <p className="font-display text-4xl font-semibold leading-none tracking-[-0.05em] text-white">{value}</p>
        {suffix ? <p className="pb-1 text-sm font-medium text-slate-300">{suffix}</p> : null}
      </div>
      <p className="mt-3 text-[12px] leading-5 text-slate-300">{detail}</p>
    </Card>
  );
}

export default function CarbonImpactHero({
  summary,
  alertCount,
  selectedAlert,
  mode,
}) {
  const trackedAlerts = summary?.carbonTrackedAlerts || 0;
  const totalAlerts = summary?.alertCount ?? alertCount ?? 0;
  const atRiskCarbon = summary?.estimatedCarbonAtRiskTonnes || 0;
  const protectedAreaCarbon = summary?.protectedAreaCarbonTonnes || 0;
  const selectedCarbon = selectedAlert?.estimatedCarbonTonnes || 0;

  return (
    <div className="grid h-full min-h-0 gap-3 sm:grid-cols-2">
      <MiniCard
        icon={Leaf}
        label="Emissions at Risk"
        value={formatTonnes(atRiskCarbon)}
        suffix="tCO2e"
        detail={mode === "live" ? "Live emissions exposure across the monitored zone." : "Current emissions estimate from the active ForestGuard dataset."}
        tone="success"
      />
      <MiniCard
        icon={AlertTriangle}
        label="Protected Area Impact"
        value={formatTonnes(protectedAreaCarbon)}
        suffix="tCO2e"
        detail="Emissions tied specifically to alerts inside the protected-area boundary."
        tone="warning"
      />
      <MiniCard
        icon={Trees}
        label="Cases Reviewed"
        value={`${trackedAlerts}/${totalAlerts}`}
        suffix="cases"
        detail="Live cases with enough area data for emissions review."
      />
      <Card className="rounded-[24px] border border-cyan-300/20 bg-cyan-300/10 p-4 text-white shadow-none">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-[#08111f]">
              <ShieldCheck className="h-4 w-4 text-cyan-200" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">Case Impact</p>
          </div>
          <Badge
            className={`border-0 text-[10px] ${
              mode === "live" ? "bg-emerald-400/15 text-emerald-100" : mode === "loading" ? "bg-cyan-400/15 text-cyan-100" : "bg-amber-400/15 text-amber-100"
            }`}
          >
            {mode === "live" ? "Live public data" : mode === "loading" ? "Loading live data" : "Fallback demo data"}
          </Badge>
        </div>
        <div className="mt-5 flex items-end gap-2">
          <p className="font-display text-4xl font-semibold leading-none tracking-[-0.05em] text-white">
            {selectedAlert?.carbonTracked ? formatTonnes(selectedCarbon) : "N/A"}
          </p>
          {selectedAlert?.carbonTracked ? <p className="pb-1 text-sm font-medium text-cyan-100">tCO2e</p> : null}
        </div>
        <p className="mt-3 text-[12px] leading-5 text-slate-300">
          {selectedAlert?.carbonTracked
            ? "Estimated emissions for the active case."
            : "Select a scored alert to pin the active case impact here."}
        </p>
      </Card>
    </div>
  );
}
