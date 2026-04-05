import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const monthlyData = [
  { month: "Jul", hectares: 980 },
  { month: "Aug", hectares: 1540 },
  { month: "Sep", hectares: 2680 },
  { month: "Oct", hectares: 1420 },
  { month: "Nov", hectares: 2100 },
  { month: "Dec", hectares: 3200 },
  { month: "Jan", hectares: 3750 },
  { month: "Feb", hectares: 1890 },
  { month: "Mar", hectares: 2440 },
];

const riskBreakdown = [
  { name: "APA Triunfo (Core)", risk: 97 },
  { name: "APA Triunfo (North)", risk: 94 },
  { name: "SFX South", risk: 86 },
  { name: "SFX East", risk: 81 },
  { name: "APA Triunfo (West)", risk: 64 },
];

export default function DeforestationChart() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card className="p-5">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-sm font-semibold">Forest-to-Pasture Conversion (ha/month)</CardTitle>
          <p className="text-xs text-muted-foreground">São Félix do Xingu municipality — DETER/PRODES data</p>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="forestLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0,75%,55%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(0,75%,55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(155,12%,89%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(160,10%,44%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(160,10%,44%)" />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(155,12%,89%)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="hectares" stroke="hsl(0,75%,55%)" fill="url(#forestLoss)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="p-5">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-sm font-semibold">Zone Risk Scores</CardTitle>
          <p className="text-xs text-muted-foreground">Sub-zones within São Félix do Xingu (0–100)</p>
        </CardHeader>
        <CardContent className="p-0">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(155,12%,89%)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(160,10%,44%)" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(160,10%,44%)" width={110} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(155,12%,89%)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="risk" radius={[0, 6, 6, 0]} fill="hsl(152,60%,36%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}