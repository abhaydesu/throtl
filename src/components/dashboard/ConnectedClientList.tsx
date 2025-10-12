// Filename: src/components/dashboard/ConnectedClientsList.tsx
import { useState, useEffect, type ChangeEvent } from "react";
import type { Client } from "../../types";
import { motion, AnimatePresence } from "framer-motion";

const formatBps = (bps: number) => {
  if (bps > 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  return `${(bps / 1_000).toFixed(1)} Kbps`;
};

const BandwidthBar = ({ bps, maxBps }: { bps: number; maxBps: number }) => {
  const percentage = maxBps > 0 ? (bps / maxBps) * 100 : 0;
  return (
    <div className="w-24 h-2 bg-neutral-700 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-sky-500"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};

type Props = {
  clients: Client[];
  onClientSelect: (ip: string | null) => void;
  selectedClientIp: string | null;
  onThrottle: (ip: string, limitMbps: number) => Promise<void>;
  onUnthrottle: (ip: string) => Promise<void>;
  pendingActionIp: string | null;
  defaultThrottleLimit: number;
};

export function ConnectedClientsList({
  clients,
  onClientSelect,
  selectedClientIp,
  onThrottle,
  onUnthrottle,
  pendingActionIp,
  defaultThrottleLimit,
}: Props) {
  console.log("[ConnectedClientsList] render", {
    clients: clients.length,
    selectedClientIp,
    pendingActionIp,
  });
  const sortedClients = [...clients].sort(
    (a, b) => b.liveDownload - a.liveDownload
  );
  const maxBps = Math.max(...clients.map((c) => c.liveDownload), 1); // Avoid division by zero
  const [throttleLimit, setThrottleLimit] =
    useState<number>(defaultThrottleLimit);

  useEffect(() => {
    setThrottleLimit(defaultThrottleLimit);
  }, [defaultThrottleLimit]);

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    if (Number.isNaN(nextValue)) return;
    setThrottleLimit(Math.max(nextValue, 0.1));
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-sm p-4">
      <h3 className="text-lg font-semibold text-neutral-200 mb-4">
        Connected Clients
      </h3>
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
        <label className="flex items-center gap-2">
          Throttle limit (Mbps)
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={throttleLimit}
            onChange={handleLimitChange}
            className="w-20 rounded-sm border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
          />
        </label>
        <span className="text-neutral-500">
          Applies to new throttle actions
        </span>
      </div>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {sortedClients.map((client) => (
            <motion.div
              key={client.ip}
              layout
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() =>
                onClientSelect(
                  selectedClientIp === client.ip ? null : client.ip
                )
              }
              className={`p-3 rounded-sm cursor-pointer flex flex-col gap-3 transition-colors border border-transparent ${
                selectedClientIp === client.ip
                  ? "bg-sky-900/20 border-sky-800/50"
                  : "hover:bg-neutral-800/60"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      client.status === "throttled"
                        ? "bg-red-500 animate-pulse"
                        : "bg-green-500"
                    }`}
                  ></span>
                  <div>
                    <div className="font-mono text-neutral-200 text-sm">
                      {client.ip}
                    </div>
                    <div className="text-xs text-neutral-500 capitalize">
                      {client.status}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-neutral-400 w-24 text-right">
                    {formatBps(client.liveDownload)}
                  </span>
                  <BandwidthBar bps={client.liveDownload} maxBps={maxBps} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onThrottle(client.ip, throttleLimit).catch(() => undefined);
                  }}
                  disabled={
                    pendingActionIp === client.ip ||
                    client.status === "throttled"
                  }
                  className={`px-3 py-1 rounded-sm border transition-colors ${
                    pendingActionIp === client.ip
                      ? "border-sky-800 text-sky-300 bg-sky-900/30 cursor-wait"
                      : client.status === "throttled"
                      ? "border-neutral-800 text-neutral-500 cursor-not-allowed"
                      : "border-sky-700 text-sky-300 hover:bg-sky-900/30"
                  }`}
                >
                  {pendingActionIp === client.ip
                    ? "Applying…"
                    : `Throttle to ${throttleLimit.toFixed(1)} Mbps`}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUnthrottle(client.ip).catch(() => undefined);
                  }}
                  disabled={
                    pendingActionIp === client.ip ||
                    client.status !== "throttled"
                  }
                  className={`px-3 py-1 rounded-sm border transition-colors ${
                    pendingActionIp === client.ip
                      ? "border-green-900 text-green-300 bg-green-900/30 cursor-wait"
                      : client.status !== "throttled"
                      ? "border-neutral-800 text-neutral-500 cursor-not-allowed"
                      : "border-green-700 text-green-300 hover:bg-green-900/30"
                  }`}
                >
                  {pendingActionIp === client.ip ? "Applying…" : "Unthrottle"}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
