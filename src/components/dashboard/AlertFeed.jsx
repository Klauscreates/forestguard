import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, Clock, ChevronRight, TrendingUp, Shield, FileX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const alerts = [
  {
    id: 1,
    type: "Forest-Loss Spike",
    severity: "critical",
    icon: TrendingUp,
    title: "Forest-loss alerts surged +62% in 7 days — APA Triunfo do Xingu",
    description: "New DETER alerts spiked inside the monitored São Félix do Xingu beef sourcing zone. Fishbone clearing patterns confirm cattle pasture expansion.",
    why: "This is a monitored beef-linked sourcing zone. Spike indicates active conversion pressure.",
    action: "Generate supplier review packet and request updated traceability documents.",
    time: "2 hours ago",
    coordinates: "6.6°S, 52.0°W",
  },
  {
    id: 2,
    type: "Protected Area Overlap",
    severity: "critical",
    icon: Shield,
    title: "Clearing clusters inside APA Triunfo do Xingu conservation area",
    description: "520 ha of new alerts overlap with APA Triunfo do Xingu — Brazil's highest fire-hotspot conservation area (InfoAmazonia, Sept 2024).",
    why: "Higher reputational and compliance sensitivity. APA Triunfo carries elevated EUDR scrutiny.",
    action: "Escalate to sustainability/compliance review and mark zone as priority watch.",
    time: "5 hours ago",
    coordinates: "6.3°S, 52.4°W",
  },
  {
    id: 3,
    type: "Traceability Gap",
    severity: "high",
    icon: FileX,
    title: "High-risk zone flagged — sourcing documentation missing",
    description: "JBS Marabá intermediary zone flagged critical, but required GTA transit permits and ranch-level traceability are unresolved in the compliance workflow.",
    why: "This is where environmental risk becomes procurement risk. No docs = no compliance clearance.",
    action: "Hold sourcing approval pending documentation and generate due-diligence summary.",
    time: "10 hours ago",
    coordinates: "7.1°S, 51.8°W",
  },
];

const severityStyles = {
  critical: { badge: "bg-destructive/10 text-destructive border-0", dot: "bg-destructive" },
  high: { badge: "bg-orange-500/10 text-orange-600 border-0", dot: "bg-orange-500" },
};

export default function AlertFeed() {
  return (
    <Card>
      <div className="p-5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h3 className="font-semibold text-foreground">Supply Chain Risk Alerts</h3>
        </div>
        <Link to="/alerts" className="text-sm text-primary hover:underline">View all</Link>
      </div>
      <div className="divide-y">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div key={alert.id} className="p-5 hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                  alert.severity === "critical" ? "bg-destructive/10" : "bg-orange-500/10"
                )}>
                  <Icon className={cn("w-4 h-4", alert.severity === "critical" ? "text-destructive" : "text-orange-600")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge className={cn("text-xs", severityStyles[alert.severity].badge)}>{alert.type}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {alert.time}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{alert.description}</p>
                  
                  <div className="mt-2.5 p-2.5 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Why Amazon cares:</span> {alert.why}</p>
                    <p className="text-xs text-muted-foreground mt-1"><span className="font-semibold text-primary">Recommended action:</span> {alert.action}</p>
                  </div>

                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {alert.coordinates}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-2 flex-shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}