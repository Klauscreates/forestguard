import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, AlertTriangle, Search, Filter, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const suppliers = [
  {
    id: "JBS-MAR",
    name: "JBS Marabá (Slaughterhouse)",
    region: "Marabá, PA",
    commodity: "Beef processing",
    risk: 94,
    status: "Flagged",
    plots: 0,
    hectares: 0,
    note: "Processing hub",
    lastAudit: "Jan 2026",
    issues: ["HRW 2025: documented links to illegal ranches via intermediaries", "Receives cattle from APA Triunfo do Xingu zone"],
  },
  {
    id: "INT-001",
    name: "Intermediary Supplier 001",
    region: "São Félix do Xingu (APA Triunfo Core)",
    commodity: "Cattle → JBS Marabá",
    risk: 97,
    status: "Suspended",
    plots: 18,
    hectares: 4200,
    lastAudit: "Nov 2025",
    issues: ["740 ha clearing inside APA Triunfo do Xingu", "GTA permits trace cattle to JBS Marabá"],
  },
  {
    id: "INT-002",
    name: "Intermediary Supplier 002",
    region: "São Félix do Xingu (APA Triunfo North)",
    commodity: "Cattle → JBS Marabá",
    risk: 94,
    status: "Suspended",
    plots: 14,
    hectares: 3100,
    lastAudit: "Dec 2025",
    issues: ["520 ha fishbone clearing → pasture", "Inside conservation area boundary"],
  },
  {
    id: "INT-003",
    name: "Intermediary Supplier 003",
    region: "São Félix do Xingu (South)",
    commodity: "Cattle → JBS Marabá",
    risk: 86,
    status: "Under Review",
    plots: 22,
    hectares: 5400,
    lastAudit: "Feb 2026",
    issues: ["380 ha pasture expansion in JBS intermediary zone"],
  },
  {
    id: "INT-004",
    name: "Intermediary Supplier 004",
    region: "São Félix do Xingu (East)",
    commodity: "Cattle → local market",
    risk: 81,
    status: "Under Review",
    plots: 16,
    hectares: 3800,
    lastAudit: "Feb 2026",
    issues: ["290 ha slash-and-burn → pasture"],
  },
  {
    id: "INT-005",
    name: "Intermediary Supplier 005",
    region: "São Félix do Xingu (NE)",
    commodity: "Cattle → regional",
    risk: 55,
    status: "Watchlist",
    plots: 10,
    hectares: 2400,
    lastAudit: "Mar 2026",
    issues: ["110 ha gradual pasture encroachment"],
  },
  {
    id: "INT-006",
    name: "Intermediary Supplier 006",
    region: "São Félix do Xingu (SW)",
    commodity: "Cattle → regional",
    risk: 28,
    status: "Compliant",
    plots: 8,
    hectares: 1800,
    lastAudit: "Mar 2026",
    issues: [],
  },
];

const statusStyles = {
  Flagged: "bg-destructive/10 text-destructive",
  Suspended: "bg-destructive/10 text-destructive",
  "Under Review": "bg-orange-500/10 text-orange-600",
  Watchlist: "bg-amber-500/10 text-amber-600",
  Compliant: "bg-primary/10 text-primary",
};

export default function SupplyChain() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Supply Chain Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Beef cattle supply chain — São Félix do Xingu → JBS Marabá → Amazon procurement
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Suppliers", value: "7", color: "text-foreground" },
          { label: "Suspended/Flagged", value: "3", color: "text-destructive" },
          { label: "Under Review", value: "2", color: "text-orange-600" },
          { label: "Compliant", value: "1", color: "text-primary" },
        ].map((s, i) => (
          <Card key={i} className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search suppliers, zones..." className="pl-9" />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Filter
        </Button>
      </div>

      {/* Scalability note */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Scalability:</span> Today we monitor cattle-linked sourcing risk in São Félix do Xingu. Tomorrow the same workflow supports soy in Mato Grosso, palm oil in Borneo, timber in the Chocó.
        </p>
      </Card>

      <div className="space-y-4">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-11 h-11 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {supplier.id.slice(0, 3)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{supplier.name}</h3>
                    <Badge variant="outline" className="text-xs">{supplier.id}</Badge>
                    <Badge className={cn("text-xs border-0", statusStyles[supplier.status])}>{supplier.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{supplier.region}</span>
                    <span>{supplier.commodity}</span>
                    {supplier.plots > 0 && <span>{supplier.plots} ranches</span>}
                    {supplier.hectares > 0 && <span>{supplier.hectares.toLocaleString()} ha</span>}
                    {supplier.note && <span className="font-medium">{supplier.note}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Risk</p>
                  <p className={cn(
                    "text-xl font-bold",
                    supplier.risk > 80 ? "text-destructive" : supplier.risk > 60 ? "text-orange-600" : supplier.risk > 40 ? "text-amber-600" : "text-primary"
                  )}>
                    {supplier.risk}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  Details <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {supplier.issues.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Active Issues
                </p>
                <div className="flex flex-wrap gap-2">
                  {supplier.issues.map((issue, j) => (
                    <Badge key={j} variant="secondary" className="text-xs font-normal">{issue}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}