import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const healthStatusVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      status: {
        excellent: "health-status-excellent",
        good: "health-status-good", 
        normal: "health-status-normal",
        attention: "health-status-attention",
        concern: "health-status-concern",
      },
    },
    defaultVariants: {
      status: "normal",
    },
  }
);

export interface HealthStatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof healthStatusVariants> {
  status: "excellent" | "good" | "normal" | "attention" | "concern";
}

function HealthStatusBadge({
  className,
  status,
  ...props
}: HealthStatusBadgeProps) {
  return (
    <div
      className={cn(healthStatusVariants({ status }), className)}
      {...props}
    />
  );
}

export { HealthStatusBadge, healthStatusVariants };