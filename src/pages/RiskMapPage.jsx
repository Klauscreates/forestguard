import RiskMap from "../components/dashboard/RiskMap";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const regionDetails = [
  { name: "APA Triunfo do Xingu (Core)", risk: 97, hectares: 740, suppliers: 3, status: "Critical", type: "Cattle pasture — #1 fire hotspot in Brazil" },
  { name: "APA Triunfo do Xingu (North)", risk: 94, hectares: 520, suppliers: 2, status: "Critical", type: "Fishbone road network → pasture" },
  { name: "São Félix do Xingu (South)", risk: 86, hectares: 380, suppliers: 4, status: "High", type: "JBS intermediary sourcing zone" },
  { name: "São Félix do Xingu (East)", risk: 81, hectares: 290, suppliers: 2, status: "High", type: "Slash-and-burn → pasture conversion" },
  { name: "APA Triunfo do Xingu (West)", risk: 64, hectares: 160, suppliers: 1, status: "Medium", type: "Selective logging → ranching" },
  { name: "São Félix do Xingu (NE)", risk: 55, hectares: 110, suppliers: 2, status: "Medium", type: "Gradual pasture encroachment" },
  { name: "São Félix do Xingu (SW)", risk: 28, hectares: 40, suppliers: 1, status: "Low", type: "Minor edge disturbance" },
];

const statusColor = {
  Critical: "bg-destructive/10 text-destructive",
  High: "bg-orange-500/10 text-orange-600",
  Medium: "bg-amber-500/10 text-amber-600",
  Low: "bg-blue-500/10 text-blue-600",
};

export default function RiskMapPage() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Risk Map</h1>
        <p className="text-sm text-muted-foreground mt-1">São Félix do Xingu — Brazil's #1 cattle municipality (2.5M head, IBGE 2023)</p>
      </div>

      <RiskMap />

      <Card>
        <div className="p-4 border-b flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Zone Risk Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold text-muted-foreground">Zone</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Risk Score</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Hectares Lost</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Threat Type</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Suppliers</th>
                <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {regionDetails.map((r, i) => (
                <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    {r.name}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${r.risk}%`,
                            backgroundColor: r.risk > 80 ? "hsl(0,75%,55%)" : r.risk > 60 ? "hsl(30,90%,55%)" : r.risk > 40 ? "hsl(45,95%,55%)" : "hsl(200,70%,50%)"
                          }}
                        />
                      </div>
                      <span className="font-semibold text-foreground">{r.risk}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{r.hectares.toLocaleString()} ha</td>
                  <td className="p-3 text-xs text-muted-foreground">{r.type}</td>
                  <td className="p-3 text-muted-foreground">{r.suppliers}</td>
                  <td className="p-3">
                    <Badge className={cn("text-xs border-0", statusColor[r.status])}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}