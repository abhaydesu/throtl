// Filename: src/pages/Dashboard.tsx

// Import your new components and hook
import { Header } from "../components/dashboard/Header";
import { StatCard } from "../components/dashboard/StatCard";
import { NetworkHealthChart } from "../components/dashboard/NetworkHealthChart";
import { ConnectedClientsList } from "../components/dashboard/ConnectedClientList";
import { BandwidthDonutChart } from "../components/dashboard/BandwidthDonutChart";
import { EventsLog } from "../components/dashboard/EventsLog";
import {
  useNetworkData,
  THRESHOLD_BPS,
  DEFAULT_THROTTLE_LIMIT_MBPS,
} from "../hooks/useNetworkData";

export function Dashboard() {
  // All the complex logic is now hidden inside this single hook
  const {
    clients,
    chartData,
    events,
    selectedClientIp,
    setSelectedClientIp,
    isLoading,
    error,
    lastUpdated,
    websocketReadyState,
    rateLimitWarning,
    throttleDevice,
    unthrottleDevice,
    pendingActionIp,
    actionMessage,
    actionError,
    resetActionMessage,
  } = useNetworkData();

  const selectedClient = clients.find((c) => c.ip === selectedClientIp);
  const totalBandwidthBps = clients.reduce(
    (sum, client) => sum + client.liveDownload,
    0
  );

  const connectionStatus = (() => {
    switch (websocketReadyState) {
      case 1:
        return { label: "Live", tone: "text-green-400", dot: "bg-green-400" };
      case 0:
        return {
          label: "Connecting",
          tone: "text-yellow-400",
          dot: "bg-yellow-400",
        };
      case 2:
        return {
          label: "Closing",
          tone: "text-yellow-500",
          dot: "bg-yellow-500",
        };
      default:
        return { label: "Offline", tone: "text-red-400", dot: "bg-red-500" };
    }
  })();

  const formatBps = (bps: number) => {
    if (bps >= 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
    if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
    return `${(bps / 1_000).toFixed(1)} Kbps`;
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <Header />

      <div className="flex flex-wrap gap-3 items-center text-sm">
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-neutral-800 bg-neutral-900/60 ${connectionStatus.tone}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${connectionStatus.dot}`}
          ></span>
          WebSocket: {connectionStatus.label}
        </span>
        {lastUpdated && (
          <span className="px-3 py-1 rounded-sm border border-neutral-800 bg-neutral-900/60 text-neutral-400">
            Last update: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        {isLoading && (
          <span className="px-3 py-1 rounded-sm border border-blue-900/60 bg-blue-900/10 text-blue-300 animate-pulse">
            Syncing with NetGuardian backend…
          </span>
        )}
      </div>

      {(error || rateLimitWarning || actionMessage || actionError) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-sm border border-red-900 bg-red-950/70 text-red-200 px-4 py-2 text-sm">
              {error}
            </div>
          )}
          {rateLimitWarning && (
            <div className="rounded-sm border border-yellow-900 bg-yellow-950/70 text-yellow-200 px-4 py-2 text-sm">
              {rateLimitWarning}
            </div>
          )}
          {actionMessage && (
            <div className="rounded-sm border border-green-900 bg-green-950/70 text-green-200 px-4 py-2 text-sm flex justify-between items-center">
              <span>{actionMessage}</span>
              <button
                onClick={resetActionMessage}
                className="text-green-300 hover:text-green-200 text-xs uppercase tracking-wide"
              >
                Dismiss
              </button>
            </div>
          )}
          {actionError && (
            <div className="rounded-sm border border-red-900 bg-red-950/70 text-red-200 px-4 py-2 text-sm flex justify-between items-center">
              <span>{actionError}</span>
              <button
                onClick={resetActionMessage}
                className="text-red-300 hover:text-red-200 text-xs uppercase tracking-wide"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          <div className="rounded-sm bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 p-6 shadow-2xl border border-neutral-800">
            {/* Header for the main chart card */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-neutral-100">
                Network Activity
              </h2>
              <p className="text-sm text-neutral-400 mt-1">
                Real-time throughput over the last 60 seconds
              </p>
            </div>

            <NetworkHealthChart
              data={chartData}
              threshold={THRESHOLD_BPS}
              selectedClientData={selectedClient?.downloadHistory}
              selectedClientIp={selectedClientIp}
            />

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Bandwidth"
                value={<>{formatBps(totalBandwidthBps)}</>}
                hint="Total throughput"
              />
              <StatCard
                title="Active Devices"
                value={clients.length}
                hint="Currently on network"
              />
              <StatCard title="Avg Latency" value={<>24 ms</>} hint="Stable" />
            </div>
          </div>
          <EventsLog events={events} />
        </section>

        <aside className="lg:col-span-1 space-y-8">
          <BandwidthDonutChart clients={clients} />
          <ConnectedClientsList
            clients={clients}
            onClientSelect={setSelectedClientIp}
            selectedClientIp={selectedClientIp}
            onThrottle={throttleDevice}
            onUnthrottle={unthrottleDevice}
            pendingActionIp={pendingActionIp}
            defaultThrottleLimit={DEFAULT_THROTTLE_LIMIT_MBPS}
          />
        </aside>
      </div>
    </div>
  );
}
