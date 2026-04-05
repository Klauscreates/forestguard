import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, ChevronRight, Search, TrendingUp, Shield, FileX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";

const allAlerts = [
  {
    id: 1, severity: "critical", type: "Forest-Loss Spike", icon: TrendingUp,
    title: "Forest-loss alerts surged +62% in 7 days — APA Triunfo do Xingu (Core)",
    desc: "DETER alerts spiked inside monitored beef sourcing zone. Fishbone clearing patterns confirm cattle pasture expansion. 740 ha affected.",
    why: "This is a monitored beef-linked sourcing zone. Spike indicates active conversion pressure.",
    action: "Generate supplier review packet and request updated traceability documents.",
    time: "2 hours ago", coords: "6.6°S, 52.0°W", supplier: "JBS (intermediary)",
  },
  {
    id: 2, severity: "critical", type: "Protected Area Overlap", icon: Shield,
    title: "520 ha clearing clusters inside APA Triunfo do Xingu conservation area",
    desc: "New clearing overlaps with APA Triunfo do Xingu — Brazil's highest fire-hotspot conservation area (InfoAmazonia, Sept 2024). Fishbone road network expanding.",
    why: "Higher reputational and compliance sensitivity. APA Triunfo carries elevated EUDR scrutiny.",
    action: "Escalate to sustainability/compliance review and mark zone as priority watch.",
    time: "5 hours ago", coords: "6.3°S, 52.4°W", supplier: "JBS (intermediary)",
  },
  {
    id: 3, severity: "high", type: "Traceability Gap", icon: FileX,
    title: "High-risk zone flagged — GTA transit documentation missing",
    desc: "JBS Marabá intermediary zone flagged critical (risk score 94), but required GTA transit permits and ranch-level traceability are unresolved in compliance workflow.",
    why: "Environmental risk becomes procurement risk when documentation is missing.",
    action: "Hold sourcing approval pending documentation and generate due-diligence summary.",
    time: "10 hours ago", coords: "7.1°S, 51.8°W", supplier: "JBS Marabá",
  },
  {
    id: 4, severity: "high", type: "Forest-Loss Spike", icon: TrendingUp,
    title: "290 ha slash-and-burn detected — São Félix do Xingu (East)",
    desc: "VIIRS thermal alerts confirm active fire scars for cattle pasture conversion. Rectangular clearing blocks visible on Sentinel-2 optical imagery.",
    why: "Active fire-linked clearing in cattle zone. Beef from this zone may not meet EUDR deforestation-free threshold.",
    action: "Flag zone in risk register and request satellite verification report.",
    time: "14 hours ago", coords: "6.5°S, 51.3°W", supplier: "Local intermediary",
  },
  {
    id: 5, severity: "medium", type: "Forest-Loss Spike", icon: TrendingUp,
    title: "160 ha selective logging preceding pasture — APA Triunfo (West)",
    desc: "Progressive canopy degradation over 60 days. Pattern consistent with pre-clearing for cattle ranching expansion.",
    why: "Pre-clearing patterns often escalate to full conversion within 90 days.",
    action: "Add to 30-day monitoring watchlist and schedule follow-up assessment.",
    time: "1 day ago", coords: "6.8°S, 52.6°W", supplier: "Local intermediary",
  },
  {
    id: 6, severity: "medium", type: "Traceability Gap", icon: FileX,
    title: "Ranch-level geolocation incomplete — São Félix do Xingu (NE)",
    desc: "6 of 12 ranches in this sub-zone lack verified GPS coordinates in the compliance database. EUDR DDS requires parcel-level geolocation.",
    why: "Incomplete geolocation blocks DDS filing. Compliance deadline is April 30, 2026.",
    action: "Issue data request to local intermediary suppliers within 14 days.",
    time: "2 days ago", coords: "6.2°S, 51.6°W", supplier: "Local intermediary",
  },
  {
    id: 7, severity: "low", type: "Forest-Loss Spike", icon: TrendingUp,
    title: "40 ha minor disturbance — São Félix do Xingu (SW)",
    desc: "Minor edge disturbance detected. May be seasonal or small-scale. No supplier linkage confirmed.",
    why: "Low severity but within monitored municipality boundary.",
    action: "Log for record. No immediate action required.",
    time: "3 days ago", coords: "7.3°S, 52.1°W", supplier: "Unlinked",
  },
];

const severityStyles = {
  critical: { bg: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  high: { bg: "bg-orange-500/10 text-orange-600", dot: "bg-orange-500" },
  medium: { bg: "bg-amber-500/10 text-amber-600", dot: "bg-amber-500" },
  low: { bg: "bg-blue-500/10 text-blue-600", dot: "bg-blue-500" },
};

export default function Alerts() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? allAlerts : allAlerts.filter(a => a.severity === filter);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Supply Chain Risk Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">São Félix do Xingu — beef-linked sourcing risk for procurement teams</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-destructive/10 text-destructive border-0">
            {allAlerts.filter(a => a.severity === "critical").length} Critical
          </Badge>
          <Badge className="bg-orange-500/10 text-orange-600 border-0">
            {allAlerts.filter(a => a.severity === "high").length} High
          </Badge>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search alerts, zones, suppliers..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          {["all", "critical", "high", "medium", "low"].map(s => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className="capitalize text-xs">
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(alert => {
          const Icon = alert.icon;
          return (
            <Card key={alert.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                  alert.severity === "critical" ? "bg-destructive/10" : alert.severity === "high" ? "bg-orange-500/10" : alert.severity === "medium" ? "bg-amber-500/10" : "bg-blue-500/10"
                )}>
                  <Icon className={cn("w-4.5 h-4.5",
                    alert.severity === "critical" ? "text-destructive" : alert.severity === "high" ? "text-orange-600" : alert.severity === "medium" ? "text-amber-600" : "text-blue-600"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <Badge className={cn("text-xs border-0", severityStyles[alert.severity].bg)}>{alert.type}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {alert.time}</span>
                    <Badge variant="outline" className="text-xs">{alert.supplier}</Badge>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{alert.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{alert.desc}</p>
                  
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-1.5">
                    <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Why Amazon cares:</span> {alert.why}</p>
                    <p className="text-xs text-muted-foreground"><span className="font-semibold text-primary">Recommended action:</span> {alert.action}</p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {alert.coords}</span>
                    <Button size="sm" variant="outline" className="text-xs gap-1">Take Action <ChevronRight className="w-3 h-3" /></Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}