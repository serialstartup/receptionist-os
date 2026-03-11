"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface WeeklyChartProps {
  data: {
    day: string
    confirmed: number
    suggested: number
  }[]
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.55 0.18 260)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="oklch(0.55 0.18 260)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSuggested" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.55 0.18 260)" stopOpacity={0.08} />
              <stop offset="95%" stopColor="oklch(0.55 0.18 260)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 250)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: "oklch(0.55 0.01 260)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "oklch(0.55 0.01 260)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid oklch(0.92 0.005 250)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="confirmed"
            stroke="oklch(0.55 0.18 260)"
            strokeWidth={2}
            fill="url(#colorConfirmed)"
          />
          <Area
            type="monotone"
            dataKey="suggested"
            stroke="oklch(0.55 0.18 260)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#colorSuggested)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
