import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Download, Maximize2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: { label: string; onClick: () => void }[];
  timeRanges?: string[];
  activeTimeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  onExport?: () => void;
  onExpand?: () => void;
  height?: number;
  variant?: "default" | "glass" | "minimal";
  badge?: ReactNode;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  actions,
  timeRanges,
  activeTimeRange,
  onTimeRangeChange,
  onExport,
  onExpand,
  height = 300,
  variant = "default",
  badge,
}: ChartContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl ${
        variant === "glass"
          ? "glass-card"
          : variant === "minimal"
          ? ""
          : "bg-card border border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{title}</h3>
              {badge}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {timeRanges && (
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => onTimeRangeChange?.(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTimeRange === range
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1">
            {onExport && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExport}>
                <Download className="w-4 h-4" />
              </Button>
            )}
            {onExpand && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExpand}>
                <Maximize2 className="w-4 h-4" />
              </Button>
            )}
            {actions && actions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action) => (
                    <DropdownMenuItem key={action.label} onClick={action.onClick}>
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="px-6 py-4" style={{ height }}>
        {children}
      </div>
    </motion.div>
  );
}
