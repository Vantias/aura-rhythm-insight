import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  title: string;
  description: string;
  severity: "info" | "warning" | "attention";
  timestamp?: string;
  className?: string;
}

export function InsightCard({
  title,
  description,
  severity,
  timestamp,
  className,
}: InsightCardProps) {
  const getSeverityStyles = () => {
    switch (severity) {
      case "info":
        return "border-primary/20 bg-primary/5";
      case "warning":
        return "border-warning/20 bg-warning/5";
      case "attention":
        return "border-destructive/20 bg-destructive/5";
      default:
        return "border-primary/20 bg-primary/5";
    }
  };

  const getSeverityBadge = () => {
    switch (severity) {
      case "info":
        return <Badge variant="secondary">Insight</Badge>;
      case "warning":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pattern</Badge>;
      case "attention":
        return <Badge variant="destructive">Attention</Badge>;
      default:
        return <Badge variant="secondary">Insight</Badge>;
    }
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-card border",
        getSeverityStyles(),
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            {title}
          </CardTitle>
          {getSeverityBadge()}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        {timestamp && (
          <p className="text-xs text-muted-foreground mt-2">
            {timestamp}
          </p>
        )}
      </CardContent>
    </Card>
  );
}