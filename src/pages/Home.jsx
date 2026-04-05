import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Leaf, MapPin, FileCheck } from "lucide-react";
import RiskScoreCard from "../components/dashboard/RiskScoreCard";
import AlertFeed from "../components/dashboard/AlertFeed";
import DeforestationChart from "../components/dashboard/DeforestationChart";
import RiskMap from "../components/dashboard/RiskMap";
import ComplianceStatus from "../components/dashboard/ComplianceStatus";
import AIRecommendation from "../components/dashboard/AIRecommendation";

export default function Home() {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <Badge variant="secondary" className="text-xs gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            São Félix do Xingu, Pará — Beef cattle supply chain risk monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border-0 gap-1">
            <Shield className="w-3 h-3" /> EUDR Monitoring Active
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RiskScoreCard
          title="Overall Risk Score"
          value="91/100"
          subtitle="Critical — #1 cattle municipality"
          change="+14 pts"
          up={true}
          icon={AlertTriangle}
          iconColor="text-destructive"
          iconBg="bg-destructive/10"
        />
        <RiskScoreCard
          title="Active Alerts"
          value="7"
          subtitle="2 critical in APA Triunfo"
          change="+4 new"
          up={true}
          icon={MapPin}
          iconColor="text-chart-2"
          iconBg="bg-chart-2/10"
        />
        <RiskScoreCard
          title="Hectares at Risk"
          value="2,240"
          subtitle="São Félix do Xingu municipality"
          change="+38%"
          up={true}
          icon={Leaf}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <RiskScoreCard
          title="EUDR Compliance"
          value="40%"
          subtitle="1 of 4 steps complete"
          change="+10%"
          up={false}
          icon={FileCheck}
          iconColor="text-chart-4"
          iconBg="bg-chart-4/10"
        />
      </div>

      {/* Map */}
      <RiskMap compact />

      {/* Charts */}
      <DeforestationChart />

      {/* AI Recommendations + Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <AIRecommendation />
        </div>
        <div className="space-y-5">
          <ComplianceStatus />
        </div>
      </div>

      {/* Alert Feed */}
      <AlertFeed />
    </div>
  );
}