import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Clock, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

const steps = [
  { label: "Ranch-level mapping", status: "complete", desc: "142 ranches geolocated in São Félix do Xingu" },
  { label: "Risk assessment", status: "active", desc: "APA Triunfo do Xingu zones flagged critical" },
  { label: "Due diligence statement", status: "pending", desc: "EUDR DDS for beef — awaiting risk completion" },
  { label: "Supplier action", status: "pending", desc: "JBS Marabá intermediary audit pending" },
];

const statusIcon = {
  complete: <CheckCircle2 className="w-5 h-5 text-primary" />,
  active: <Clock className="w-5 h-5 text-chart-2" />,
  pending: <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />,
};

export default function ComplianceStatus() {
  return (
    <Card>
      <div className="p-5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">EUDR Compliance Pipeline</h3>
        </div>
        <Link to="/compliance">
          <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-muted">
            40% complete
          </Badge>
        </Link>
      </div>
      <div className="p-5">
        <Progress value={40} className="h-2 mb-5" />
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5">{statusIcon[step.status]}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
              <Badge
                className={`text-[10px] border-0 ${
                  step.status === "complete"
                    ? "bg-primary/10 text-primary"
                    : step.status === "active"
                    ? "bg-chart-2/10 text-chart-2"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}