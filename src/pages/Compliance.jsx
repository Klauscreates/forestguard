import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Download, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const pipelineSteps = [
  {
    step: 1,
    title: "Ranch-Level Mapping",
    status: "complete",
    progress: 100,
    description: "Geolocate cattle ranches within São Félix do Xingu. Cross-reference with CAR cadastral records and GTA (animal transit) permits.",
    details: [
      "142 cattle ranches mapped within São Félix do Xingu municipality",
      "GPS coordinates verified against CAR registry",
      "APA Triunfo do Xingu conservation boundary overlaid — 38 ranches inside or adjacent",
      "GTA transit permit analysis identifies cattle flow to JBS Marabá slaughterhouse",
      "Sentinel-2 baselines captured — fishbone and rectangular clearing patterns documented",
    ],
  },
  {
    step: 2,
    title: "Deforestation Risk Assessment",
    status: "active",
    progress: 65,
    description: "Assess each zone for forest-to-pasture conversion using DETER, PRODES, GLAD, and VIIRS alerts plus AI risk scoring.",
    details: [
      "DETER/PRODES + GLAD/GFW + VIIRS thermal alerts integrated for last 12 months",
      "APA Triunfo do Xingu flagged critical — highest fire hotspot count in Brazil (InfoAmazonia Sept 2024)",
      "São Félix do Xingu is #1 cattle municipality in Brazil — 2.5M head (IBGE 2023)",
      "JBS Marabá intermediary links documented by Human Rights Watch (2025)",
      "Cattle ranching drives ~40% of tropical deforestation globally",
      "Pending: Final classification on 3 borderline zones in eastern SFX",
    ],
  },
  {
    step: 3,
    title: "Due Diligence Statement (DDS)",
    status: "pending",
    progress: 0,
    description: "Generate formal DDS for EU market access. Beef products must certify deforestation-free sourcing per EUDR Article 4.",
    details: [
      "Requires completed risk assessment for all ranching zones in SFX",
      "Must include ranch geolocation, risk classification, GTA permit audit, and remediation plan",
      "Deadline: April 30, 2026 for next EU import cycle",
      "Amazon's no-deforestation beef commitment requires verified traceability",
      "Template pre-filled — awaiting final risk inputs for APA Triunfo zones",
    ],
  },
  {
    step: 4,
    title: "Supplier Action & Remediation",
    status: "pending",
    progress: 0,
    description: "Execute compliance actions: flag JBS-linked cattle lots, request GTA chain-of-custody, schedule on-site ranch audits.",
    details: [
      "JBS Marabá: Flag all cattle lots originating from APA Triunfo do Xingu",
      "JBS intermediary suppliers: Request full GTA transit documentation",
      "Ranches in critical zones: Immediate procurement hold on beef and leather",
      "Schedule on-site verification for 12 highest-risk ranches within 30 days",
      "All actions logged for EUDR audit trail",
    ],
  },
];

const statusConfig = {
  complete: { icon: CheckCircle2, color: "text-primary", label: "Complete", bg: "bg-primary/10" },
  active: { icon: Clock, color: "text-chart-2", label: "In Progress", bg: "bg-chart-2/10" },
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending", bg: "bg-muted" },
};

export default function Compliance() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">EUDR Compliance Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Due diligence for beef sourced from São Félix do Xingu, Pará
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export Report
          </Button>
          <Button size="sm" className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Generate DDS
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Overall Compliance Progress</span>
          </div>
          <span className="text-sm font-bold text-foreground">40%</span>
        </div>
        <Progress value={40} className="h-3" />
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">1 of 4 steps complete</span>
          <span className="text-xs text-muted-foreground">Deadline: April 30, 2026</span>
        </div>
      </Card>

      <div className="space-y-4">
        {pipelineSteps.map((step) => {
          const config = statusConfig[step.status];
          const StatusIcon = config.icon;
          return (
            <Card key={step.step} className="overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", config.bg)}>
                    <span className={cn("text-sm font-bold", config.color)}>{step.step}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                      <Badge className={cn("text-xs border-0", config.bg, config.color)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.progress > 0 && step.progress < 100 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">{step.progress}%</span>
                        </div>
                        <Progress value={step.progress} className="h-1.5" />
                      </div>
                    )}
                    <ul className="mt-3 space-y-1.5">
                      {step.details.map((detail, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", step.status === "complete" ? "text-primary" : "text-muted-foreground/40")} />
                          {detail}
                        </li>
                      ))}
                    </ul>
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