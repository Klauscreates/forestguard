import { MapPinned, Radar, Shield, Satellite } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function formatGeneratedAt(value) {
  if (!value) return "Awaiting refresh";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SpatialContextPanel({ alert, mode, generatedAt, sources = [], region }) {
  return (
    <Card className="flex min-h-0 flex-col rounded-[26px] border border-white/10 bg-[#091424] p-4 text-white">
      <div className="flex items-center gap-2">
        <MapPinned className="h-4 w-4 text-cyan-200" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white">Spatial context</p>
          <p className="text-[11px] text-slate-400">The map supports the decision workflow; it is not the workflow.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-[#08111f] p-3">
          <div className="flex items-center gap-2">
            <Satellite className="h-4 w-4 text-cyan-200" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">What the map shows</p>
          </div>
          <p className="mt-2 text-xs leading-6 text-slate-300">
            Dark basemap, real São Félix do Xingu and APA Triunfo do Xingu boundaries, live DETER alert centroids, and a derived density overlay.
            No raw satellite raster imagery is rendered in this view.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#08111f] p-3">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-emerald-200" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Purpose</p>
          </div>
          <ul className="mt-2 space-y-2 text-xs text-slate-300">
            <li>Spatial context for the monitored sourcing geography.</li>
            <li>Reference for protected-area overlap and alert location.</li>
            <li>Support view for the selected case and agent workflow.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#08111f] p-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-200" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Selected alert</p>
          </div>
          {alert ? (
            <div className="mt-2 space-y-2 text-xs text-slate-300">
              <p>
                <span className="font-semibold text-white">Zone:</span> {alert.zone}
              </p>
              <p>
                <span className="font-semibold text-white">Coordinates:</span> {alert.coords}
              </p>
              <p>
                <span className="font-semibold text-white">Protected-area overlap:</span> {alert.protectedAreaOverlap ? "Yes" : "No"}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-400">Select a case to pin its geography here.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            className={`border-0 text-[10px] ${
              mode === "live" ? "bg-emerald-400/15 text-emerald-100" : mode === "loading" ? "bg-cyan-400/15 text-cyan-100" : "bg-amber-400/15 text-amber-100"
            }`}
          >
            {mode === "live" ? "LIVE PUBLIC DATA" : mode === "loading" ? "LOADING LIVE DATA" : "FALLBACK DEMO DATA"}
          </Badge>
          <Badge className="border-0 bg-white/10 text-[10px] text-white">{formatGeneratedAt(generatedAt)}</Badge>
          {sources[0] && <Badge className="border-0 bg-white/10 text-[10px] text-slate-200">{sources[0]}</Badge>}
          {region?.geometryVersion && <Badge className="border-0 bg-white/10 text-[10px] text-slate-200">{region.geometryVersion}</Badge>}
        </div>
      </div>
    </Card>
  );
}
