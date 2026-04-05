import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RiskScoreCard({ title, value, subtitle, change, up, icon: Icon, iconColor, iconBg }) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1.5">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
      {change && (
        <div className="flex items-center gap-1.5 mt-3">
          {up ? (
            <TrendingUp className="w-4 h-4 text-destructive" />
          ) : (
            <TrendingDown className="w-4 h-4 text-primary" />
          )}
          <span className={cn("text-sm font-medium", up ? "text-destructive" : "text-primary")}>
            {change}
          </span>
          <span className="text-xs text-muted-foreground">vs last quarter</span>
        </div>
      )}
    </Card>
  );
}