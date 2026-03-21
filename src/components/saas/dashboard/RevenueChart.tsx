import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer } from "./ChartContainer";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface RevenueDataPoint {
  name: string;
  receita: number;
  despesas?: number;
  lucro?: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  title?: string;
  showExpenses?: boolean;
  showProfit?: boolean;
  height?: number;
  currency?: string;
}

export function RevenueChart({
  data,
  title = "Receita",
  showExpenses = false,
  showProfit = false,
  height = 300,
  currency = "R$",
}: RevenueChartProps) {
  const [activeRange, setActiveRange] = useState("12m");
  const timeRanges = ["7d", "30d", "3m", "12m"];

  const total = data.reduce((sum, d) => sum + d.receita, 0);

  return (
    <ChartContainer
      title={title}
      subtitle={`Total: ${currency} ${total.toLocaleString("pt-BR")}`}
      timeRanges={timeRanges}
      activeTimeRange={activeRange}
      onTimeRangeChange={setActiveRange}
      height={height}
      badge={
        <Badge variant="outline" className="text-success border-success/20 bg-success/5 text-[10px]">
          +12.5%
        </Badge>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              boxShadow: "var(--shadow-lg)",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`${currency} ${value.toLocaleString("pt-BR")}`, ""]}
          />
          <Area
            type="monotone"
            dataKey="receita"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#revenueGrad)"
            name="Receita"
          />
          {showExpenses && (
            <Area
              type="monotone"
              dataKey="despesas"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              fill="url(#expenseGrad)"
              name="Despesas"
            />
          )}
          {showProfit && (
            <Area
              type="monotone"
              dataKey="lucro"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              fill="url(#profitGrad)"
              name="Lucro"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
