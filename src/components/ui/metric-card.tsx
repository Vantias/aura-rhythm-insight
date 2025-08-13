import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthStatusBadge } from "@/components/ui/health-status-badge";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: "excellent" | "good" | "normal" | "attention" | "concern";
  subtitle?: string;
  trend?: "up" | "down" | "stable";
  className?: string;
  icon?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  unit,
  status,
  subtitle,
  trend,
  className,
  icon,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return "↗";
    if (trend === "down") return "↘";
    return "→";
  };

  return (
    <Card className={cn("bg-gradient-card border-border/50 transition-all hover:shadow-card", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                {value}
              </span>
              {unit && (
                <span className="text-sm text-muted-foreground">{unit}</span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {trend && <span className="text-primary">{getTrendIcon()}</span>}
                {subtitle}
              </p>
            )}
          </div>
          <HealthStatusBadge status={status} className="shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}