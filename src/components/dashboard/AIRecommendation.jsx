import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, TrendingUp, Shield, FileX } from "lucide-react";

const recommendations = [
  {
    icon: TrendingUp,
    priority: "Urgent",
    title: "Forest-loss spike in beef sourcing zone",
    description: "DETER alerts inside São Félix do Xingu surged +62% over 7 days. Fishbone patterns confirm active cattle pasture expansion in APA Triunfo do Xingu. This zone supplies cattle to JBS Marabá intermediary network.",
    reasoning: "Spike in monitored sourcing zone = elevated procurement risk. Request updated traceability before next sourcing cycle.",
    actions: ["Generate review packet", "Request traceability docs"],
    priorityColor: "bg-destructive/10 text-destructive",
  },
  {
    icon: Shield,
    priority: "Urgent",
    title: "Protected area overlap — APA Triunfo do Xingu",
    description: "520 ha of clearing clusters inside APA Triunfo do Xingu, the conservation area with Brazil's highest fire hotspot count (InfoAmazonia, Sept 2024). Higher EUDR scrutiny applies to beef sourced from protected zones.",
    reasoning: "Overlap with conservation area = elevated reputational and compliance sensitivity. Mark as priority watch.",
    actions: ["Escalate to compliance", "Mark priority watch"],
    priorityColor: "bg-destructive/10 text-destructive",
  },
  {
    icon: FileX,
    priority: "Action Required",
    title: "Traceability gap — documentation missing",
    description: "JBS Marabá intermediary zone flagged critical, but required GTA transit permits and ranch-level geolocation are unresolved. Without documentation, EUDR DDS cannot be completed for beef from this zone.",
    reasoning: "Environmental risk becomes procurement risk when docs are missing. Hold sourcing approval until resolved.",
    actions: ["Hold sourcing approval", "Generate DDS summary"],
    priorityColor: "bg-orange-500/10 text-orange-600",
  },
];

export default function AIRecommendation() {
  return (
    <Card>
      <div className="p-5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">AI Action Recommendations</h3>
        </div>
        <Badge variant="secondary" className="text-xs">Powered by AI</Badge>
      </div>
      <div className="divide-y">
        {recommendations.map((rec, i) => (
          <div key={i} className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <rec.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-[10px] border-0 ${rec.priorityColor}`}>{rec.priority}</Badge>
                </div>
                <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{rec.description}</p>
                <div className="mt-2 p-2.5 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">AI reasoning:</span> {rec.reasoning}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {rec.actions.map((action, j) => (
                    <Button key={j} variant="outline" size="sm" className="text-xs h-7 gap-1">
                      {action} <ArrowRight className="w-3 h-3" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}