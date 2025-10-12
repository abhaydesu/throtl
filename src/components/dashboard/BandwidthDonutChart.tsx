// Filename: src/components/dashboard/BandwidthDonutChart.tsx
import { memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import type { Client } from "../../types";

const COLORS = ["#0ea5e9", "#f97316", "#10b981", "#8b5cf6", "#64748b"];

function BandwidthDonutChartComponent({ clients }: { clients: Client[] }) {
  console.log("[BandwidthDonutChart] render", {
    clients: clients.length,
    total: clients.reduce((sum, c) => sum + c.liveDownload, 0),
  });
  const totalBps = clients.reduce((sum, c) => sum + c.liveDownload, 0);
  const topClients = [...clients]
    .sort((a, b) => b.liveDownload - a.liveDownload)
    .slice(0, 4);
  const otherBps =
    totalBps - topClients.reduce((sum, c) => sum + c.liveDownload, 0);

  const data = topClients.map((c) => ({ name: c.ip, value: c.liveDownload }));
  if (otherBps > 0 && clients.length > 4) {
    data.push({ name: "Other", value: otherBps });
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-sm p-4 h-64">
      <h3 className="text-lg font-semibold text-neutral-200 mb-2">
        Bandwidth Distribution
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            fill="#8884d8"
            paddingAngle={5}
            isAnimationActive={false}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Legend
            iconSize={10}
            layout="vertical"
            verticalAlign="middle"
            align="right"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export const BandwidthDonutChart = memo(BandwidthDonutChartComponent);
