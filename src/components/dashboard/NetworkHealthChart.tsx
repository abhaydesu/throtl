// Filename: src/components/dashboard/NetworkHealthChart.tsx
import { memo, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  CartesianGrid,
} from "recharts";

const formatBps = (bps: number) => {
  if (bps > 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
  if (bps > 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  if (bps > 1_000) return `${(bps / 1_000).toFixed(2)} Kbps`;
  return `${bps} bps`;
};

type Props = {
  data: { name: string; download: number }[];
  threshold: number;
  selectedClientData?: { name: string; value: number }[];
  selectedClientIp: string | null;
};

function NetworkHealthChartComponent({
  data,
  threshold,
  selectedClientData,
  selectedClientIp,
}: Props) {
  console.log("[NetworkHealthChart] render", {
    dataPoints: data.length,
    selectedClientIp,
    selectedClientPoints: selectedClientData?.length ?? 0,
  });
  // Memoize the tooltip formatter to prevent recreating on every render
  const tooltipFormatter = useMemo(() => {
    return (value: number, name: string) => {
      if (name === "value")
        return [formatBps(value), `Client: ${selectedClientIp}`];
      return [formatBps(value), "Total"];
    };
  }, [selectedClientIp]);

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <defs>
            <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="colorSelected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />

          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={{ stroke: "#4b5563" }}
            interval="preserveStartEnd"
            minTickGap={40}
          />

          <YAxis
            stroke="#9ca3af"
            tickFormatter={formatBps}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={{ stroke: "#4b5563" }}
            width={80}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#171717",
              border: "1px solid #404040",
              borderRadius: "4px",
              padding: "8px 12px",
            }}
            labelStyle={{
              color: "#d1d5db",
              fontWeight: "600",
              marginBottom: "4px",
            }}
            itemStyle={{ color: "#e5e7eb", fontSize: "13px" }}
            formatter={tooltipFormatter}
            cursor={{
              stroke: "#6b7280",
              strokeWidth: 1,
              strokeDasharray: "5 5",
            }}
          />

          {/* Main area chart for total network traffic */}
          <Area
            type="monotone"
            dataKey="download"
            stroke="#0ea5e9"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDownload)"
            animationDuration={300}
            isAnimationActive={false}
          />

          {/* Threshold line */}
          <ReferenceLine
            y={threshold}
            label={{
              value: "Throttle Threshold",
              position: "insideTopRight",
              fill: "#ef4444",
              fontSize: 12,
              fontWeight: 600,
            }}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            opacity={0.8}
          />

          {/* Selected client overlay */}
          {selectedClientData && selectedClientData.length > 0 && (
            <Line
              type="monotone"
              dataKey="value"
              data={selectedClientData}
              stroke="#f97316"
              strokeWidth={2.5}
              name="value"
              dot={false}
              animationDuration={300}
              isAnimationActive={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const NetworkHealthChart = memo(
  NetworkHealthChartComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.threshold === nextProps.threshold &&
      prevProps.selectedClientData === nextProps.selectedClientData &&
      prevProps.selectedClientIp === nextProps.selectedClientIp
    );
  }
);
